const pool = require("../config/db");

let uniqueIndexReady = false;

const ensureUniqueIndex = async () => {
    if (uniqueIndexReady) return;

    const [indexes] = await pool.execute(
        `SELECT INDEX_NAME
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'availability'
           AND INDEX_NAME = 'unique_freelancer_slot'`
    );

    if (indexes.length === 0) {
        await pool.execute(
            `ALTER TABLE availability
             ADD UNIQUE KEY unique_freelancer_slot (freelancer_id, slot_date, slot_hour)`
        );
    }

    uniqueIndexReady = true;
};

exports.ensureUniqueIndex = ensureUniqueIndex;

exports.setForDate = async ({ freelancer_id, date, available_slots }) => {
    await ensureUniqueIndex();

    const available = new Set(available_slots.map(Number));
    const values = Array.from({ length: 24 }, (_, hour) => [
        freelancer_id,
        date,
        hour,
        available.has(hour) ? "available" : "not_available",
    ]);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.execute(
            `DELETE FROM availability
             WHERE freelancer_id = ?
               AND slot_date = ?`,
            [freelancer_id, date]
        );

        await conn.query(
            `INSERT INTO availability (freelancer_id, slot_date, slot_hour, status)
             VALUES ?`,
            [values]
        );

        await conn.commit();
        return true;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getAvailableSlots = async ({ freelancer_id, date }) => {
    const [rows] = await pool.execute(
        `SELECT slot_hour
         FROM availability
         WHERE freelancer_id = ?
           AND slot_date = ?
           AND status = 'available'
         ORDER BY slot_hour ASC`,
        [freelancer_id, date]
    );

    return rows.map((row) => row.slot_hour);
};

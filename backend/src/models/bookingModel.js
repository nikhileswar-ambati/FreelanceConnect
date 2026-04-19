const pool = require("../config/db");
const availabilityModel = require("./availabilityModel");

let negotiationColumnReady = false;

const ensureNegotiationColumn = async () => {
    if (negotiationColumnReady) return;

    const [columns] = await pool.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'booking_request'
           AND COLUMN_NAME = 'freelancer_proposed_price'`
    );

    if (columns.length === 0) {
        await pool.execute(
            `ALTER TABLE booking_request
             ADD COLUMN freelancer_proposed_price DECIMAL(10,2) NULL`
        );
    }

    negotiationColumnReady = true;
};

exports.checkAvailability = async (freelancer_id, requested_date, requested_time) => {
    const [rows] = await pool.execute(
        `SELECT request_id FROM booking_request
         WHERE freelancer_id = ?
           AND requested_date = ?
           AND requested_time = ?
           AND status = 'accepted'`,
        [freelancer_id, requested_date, requested_time]
    );
    return rows;
};

exports.createRequest = async ({
    customer_id,
    freelancer_id,
    requested_date,
    requested_time,
    max_price,
    requirements,
}) => {
    await ensureNegotiationColumn();
    await availabilityModel.ensureUniqueIndex();

    const slotHour = Number(String(requested_time).split(":")[0]);
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [slotRows] = await conn.execute(
            `SELECT availability_id
             FROM availability
             WHERE freelancer_id = ?
               AND slot_date = ?
               AND slot_hour = ?
               AND status = 'available'
             FOR UPDATE`,
            [freelancer_id, requested_date, slotHour]
        );

        if (slotRows.length === 0) {
            throw new Error("SLOT_NOT_AVAILABLE");
        }

        const [res] = await conn.execute(
            `INSERT INTO booking_request
             (customer_id, freelancer_id, requested_date, requested_time,
              max_price, requirements, requested_on, status)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, 'pending')`,
            [customer_id, freelancer_id, requested_date, requested_time, max_price, requirements]
        );

        await conn.execute(
            `UPDATE availability
             SET status = 'booked'
             WHERE availability_id = ?`,
            [slotRows[0].availability_id]
        );

        await conn.commit();
        return res.insertId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getById = async (id) => {
    await ensureNegotiationColumn();

    const [rows] = await pool.execute(
        `SELECT br.*,
                uc.name AS customer_name,
                uf.name AS freelancer_name,
                fs.skill_name AS freelancer_skill
         FROM booking_request br
         JOIN customer c ON br.customer_id = c.customer_id
         JOIN user uc ON c.user_id = uc.user_id
         JOIN freelancer_profile fp ON br.freelancer_id = fp.freelancer_id
         JOIN user uf ON fp.user_id = uf.user_id
         JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
         WHERE br.request_id = ?`,
        [id]
    );
    return rows[0] || null;
};

exports.getAll = async () => {
    await ensureNegotiationColumn();

    const [rows] = await pool.execute(
        `SELECT
           br.request_id,
           br.freelancer_id,
           br.customer_id,
           br.requested_date,
           br.requested_time,
           br.max_price,
           br.freelancer_proposed_price,
           br.requirements,
           br.status,
           u.name AS customer_name,
           fs.skill_name AS freelancer_skill
         FROM booking_request br
         JOIN customer c ON br.customer_id = c.customer_id
         JOIN user u ON c.user_id = u.user_id
         JOIN freelancer_profile fp ON br.freelancer_id = fp.freelancer_id
         JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id`
    );
    return rows;
};

exports.getByCustomer = async (customer_id) => {
    await ensureNegotiationColumn();

    const [rows] = await pool.execute(
        `SELECT
           br.request_id,
           br.freelancer_id,
           br.customer_id,
           br.requested_date,
           br.requested_time,
           br.max_price,
           br.freelancer_proposed_price,
           br.requirements,
           br.status,
           u.name AS freelancer_name,
           fs.skill_name AS freelancer_skill
         FROM booking_request br
         JOIN freelancer_profile fp ON br.freelancer_id = fp.freelancer_id
         JOIN user u ON fp.user_id = u.user_id
         JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
         WHERE br.customer_id = ?`,
        [customer_id]
    );
    return rows;
};

exports.getByStatus = async (status) => {
    await ensureNegotiationColumn();

    const [rows] = await pool.execute(
        `SELECT br.*,
                uc.name AS customer_name,
                uf.name AS freelancer_name,
                fs.skill_name AS freelancer_skill
         FROM booking_request br
         JOIN customer c ON br.customer_id = c.customer_id
         JOIN user uc ON c.user_id = uc.user_id
         JOIN freelancer_profile fp ON br.freelancer_id = fp.freelancer_id
         JOIN user uf ON fp.user_id = uf.user_id
         JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
         WHERE br.status = ?
         ORDER BY br.requested_on DESC`,
        [status]
    );
    return rows;
};

exports.updateStatus = async (id, status) => {
    const booking = await exports.getById(id);
    if (!booking) return 0;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [res] = await conn.execute(
            `UPDATE booking_request SET status = ? WHERE request_id = ?`,
            [status, id]
        );

        if (status === "rejected" || status === "cancelled") {
            const slotHour = Number(String(booking.requested_time).split(":")[0]);
            await conn.execute(
                `UPDATE availability
                 SET status = 'available'
                 WHERE freelancer_id = ?
                   AND slot_date = ?
                   AND slot_hour = ?
                   AND status = 'booked'`,
                [booking.freelancer_id, booking.requested_date, slotHour]
            );
        }

        await conn.commit();
        return res.affectedRows;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.updateCustomerPrice = async (id, customerId, maxPrice) => {
    const booking = await exports.getById(id);
    if (!booking) throw new Error("NOT_FOUND");
    if (booking.customer_id !== customerId) throw new Error("UNAUTHORIZED");
    if (booking.status !== "pending") throw new Error("INVALID_STATUS");

    const [res] = await pool.execute(
        `UPDATE booking_request
         SET max_price = ?
         WHERE request_id = ?`,
        [maxPrice, id]
    );
    return res.affectedRows;
};

exports.updateFreelancerProposedPrice = async (id, freelancerId, proposedPrice) => {
    const booking = await exports.getById(id);
    if (!booking) throw new Error("NOT_FOUND");
    if (booking.freelancer_id !== freelancerId) throw new Error("UNAUTHORIZED");
    if (booking.status !== "pending") throw new Error("INVALID_STATUS");

    const [res] = await pool.execute(
        `UPDATE booking_request
         SET freelancer_proposed_price = ?
         WHERE request_id = ?`,
        [proposedPrice, id]
    );
    return res.affectedRows;
};

exports.accept = async (requestId, freelancerId, finalPrice) => {
    await ensureNegotiationColumn();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.execute(
            `SELECT * FROM booking_request WHERE request_id = ? FOR UPDATE`,
            [requestId]
        );
        const request = rows[0];

        if (!request) throw new Error("NOT_FOUND");
        if (request.status !== "pending") throw new Error("INVALID_STATUS");
        if (request.freelancer_id !== freelancerId) throw new Error("UNAUTHORIZED");

        await conn.execute(
            `UPDATE booking_request SET status = 'accepted' WHERE request_id = ?`,
            [requestId]
        );

        await conn.execute(
            `INSERT INTO booking (request_id, freelancer_id, final_price, booked_date, booked_time, accepted_on)
             VALUES (?, ?, ?, ?, ?, CURRENT_DATE)`,
            [requestId, freelancerId, finalPrice, request.requested_date, request.requested_time]
        );

        await conn.execute(
            `UPDATE customer SET bookings_done = bookings_done + 1 WHERE customer_id = ?`,
            [request.customer_id]
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

exports.getBookedSlots = async (freelancer_id, date) => {
    const [rows] = await pool.execute(
        `SELECT requested_time
         FROM booking_request
         WHERE freelancer_id = ?
           AND requested_date = ?
           AND status = 'accepted'`,
        [freelancer_id, date]
    );
    return rows;
};

exports.delete = async (id) => {
    const [res] = await pool.execute(
        `DELETE FROM booking_request WHERE request_id = ?`,
        [id]
    );
    return res.affectedRows;
};

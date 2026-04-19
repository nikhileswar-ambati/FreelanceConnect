const pool = require("../config/db");
const availabilityModel = require("./availabilityModel");

let negotiationColumnReady = false;
let timeSlotsTableReady = false;
let bookingAuditColumnsReady = false;

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

const ensureTimeSlotsTable = async () => {
    if (timeSlotsTableReady) return;

    const [tables] = await pool.execute(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'booking_request_time_slots'`
    );

    if (tables.length === 0) {
        await pool.execute(
            `CREATE TABLE IF NOT EXISTS booking_request_time_slots (
                slot_id INT NOT NULL AUTO_INCREMENT,
                request_id INT NOT NULL,
                slot_hour INT NOT NULL,
                PRIMARY KEY (slot_id),
                UNIQUE KEY unique_request_slot (request_id, slot_hour),
                CONSTRAINT fk_request_slots_request
                    FOREIGN KEY (request_id) REFERENCES booking_request (request_id)
                    ON DELETE CASCADE
            )`
        );
    }

    timeSlotsTableReady = true;
};

const ensureBookingAuditColumns = async () => {
    if (bookingAuditColumnsReady) return;

    const [requestColumns] = await pool.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'booking_request'
           AND COLUMN_NAME IN ('requested_at', 'completed_at')`
    );

    const requestColumnNames = new Set(requestColumns.map((column) => column.COLUMN_NAME));

    if (!requestColumnNames.has("requested_at")) {
        await pool.execute(
            `ALTER TABLE booking_request
             ADD COLUMN requested_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`
        );
    }

    if (!requestColumnNames.has("completed_at")) {
        await pool.execute(
            `ALTER TABLE booking_request
             ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL`
        );
    }

    const [bookingColumns] = await pool.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'booking'
           AND COLUMN_NAME = 'accepted_at'`
    );

    if (bookingColumns.length === 0) {
        await pool.execute(
            `ALTER TABLE booking
             ADD COLUMN accepted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`
        );
    }

    bookingAuditColumnsReady = true;
};

const attachRequestedTimes = async (rows) => {
    if (!rows || rows.length === 0) return rows || [];

    try {
        const requestIds = rows.map((row) => row.request_id);
        const placeholders = requestIds.map(() => "?").join(",");
        const [slotRows] = await pool.execute(
            `SELECT request_id, slot_hour FROM booking_request_time_slots
             WHERE request_id IN (${placeholders})
             ORDER BY request_id, slot_hour`,
            requestIds
        );

        const slotsByRequest = {};
        if (slotRows && slotRows.length > 0) {
            slotRows.forEach((slot) => {
                if (!slotsByRequest[slot.request_id]) {
                    slotsByRequest[slot.request_id] = [];
                }
                slotsByRequest[slot.request_id].push(slot.slot_hour);
            });
        }

        rows.forEach((row) => {
            row.requested_times = slotsByRequest[row.request_id]
                || [Number(String(row.requested_time || "0:00").split(":")[0])];
        });
    } catch (err) {
        rows.forEach((row) => {
            row.requested_times = [Number(String(row.requested_time || "0:00").split(":")[0])];
        });
    }

    return rows;
};

exports.checkAvailability = async (freelancer_id, requested_date, requested_times) => {
    try {
        // Support both single time and array of times
        const times = Array.isArray(requested_times) ? requested_times : [requested_times];
        
        if (times.length === 0) return [];

        // Convert times to hours for proper comparison
        const slotHours = times.map(time => {
            const hour = Number(String(time).split(":")[0]);
            return isNaN(hour) ? 0 : hour;
        });

        // Check availability against accepted bookings
        const placeholders = slotHours.map(() => '?').join(',');
        const [rows] = await pool.execute(
            `SELECT br.request_id, br.requested_time 
             FROM booking_request br
             WHERE br.freelancer_id = ?
               AND br.requested_date = ?
               AND HOUR(br.requested_time) IN (${placeholders})
               AND br.status = 'accepted'`,
            [freelancer_id, requested_date, ...slotHours]
        );
        return rows || [];
    } catch (error) {
        console.error("checkAvailability error:", error);
        return [];
    }
};

exports.createRequest = async ({
    customer_id,
    freelancer_id,
    requested_date,
    requested_times,
    max_price,
    requirements,
}) => {
    await ensureNegotiationColumn();
    await ensureTimeSlotsTable();
    await ensureBookingAuditColumns();
    await availabilityModel.ensureUniqueIndex();

    // Support both single time and array
    const times = Array.isArray(requested_times) ? requested_times : [requested_times];
    const slotHours = times.map(time => {
        const hour = Number(String(time).split(":")[0]);
        return isNaN(hour) ? 0 : hour;
    });

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Check availability for all slots
        for (const slotHour of slotHours) {
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

            if (!slotRows || slotRows.length === 0) {
                throw new Error("SLOT_NOT_AVAILABLE");
            }
        }

        // Create booking request
        const [res] = await conn.execute(
            `INSERT INTO booking_request
             (customer_id, freelancer_id, requested_date, requested_time,
              max_price, requirements, requested_on, requested_at, status)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, CURRENT_TIMESTAMP, 'pending')`,
            [customer_id, freelancer_id, requested_date, times[0], max_price || 0, requirements || ""]
        );

        const requestId = res.insertId;

        // Insert time slots
        for (const slotHour of slotHours) {
            await conn.execute(
                `INSERT INTO booking_request_time_slots
                 (request_id, slot_hour) VALUES (?, ?)`,
                [requestId, slotHour]
            );

            // Mark availability as booked
            await conn.execute(
                `UPDATE availability
                 SET status = 'booked'
                 WHERE freelancer_id = ?
                   AND slot_date = ?
                   AND slot_hour = ?`,
                [freelancer_id, requested_date, slotHour]
            );
        }

        await conn.commit();
        return requestId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getById = async (id) => {
    try {
        await ensureNegotiationColumn();
        await ensureBookingAuditColumns();

        const [rows] = await pool.execute(
            `SELECT br.*,
                    b.booking_id,
                    b.final_price,
                    b.booked_date,
                    b.booked_time,
                    b.accepted_on,
                    b.accepted_at,
                    r.review_id,
                    uc.name AS customer_name,
                    uf.name AS freelancer_name,
                    fs.skill_name AS freelancer_skill
             FROM booking_request br
             LEFT JOIN customer c ON br.customer_id = c.customer_id
             LEFT JOIN user uc ON c.user_id = uc.user_id
             LEFT JOIN freelancer_profile fp ON br.freelancer_id = fp.freelancer_id
             LEFT JOIN user uf ON fp.user_id = uf.user_id
             LEFT JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
             LEFT JOIN booking b ON br.request_id = b.request_id
             LEFT JOIN review r ON b.booking_id = r.booking_id
             WHERE br.request_id = ?`,
            [id]
        );

        if (!rows || rows.length === 0) return null;

        const booking = rows[0];

        await attachRequestedTimes([booking]);

        return booking;
    } catch (error) {
        console.error("getById error:", error);
        return null;
    }
};

exports.getAll = async () => {
    try {
        await ensureNegotiationColumn();
        await ensureBookingAuditColumns();

        const [rows] = await pool.execute(
            `SELECT
               br.request_id,
               br.freelancer_id,
               br.customer_id,
               br.requested_on,
               br.requested_at,
               br.completed_at,
               br.requested_date,
               br.requested_time,
               br.max_price,
               br.freelancer_proposed_price,
               br.requirements,
               br.status,
               b.booking_id,
               b.final_price,
               b.booked_date,
               b.booked_time,
               b.accepted_on,
               b.accepted_at,
               r.review_id,
               u.name AS customer_name,
               fs.skill_name AS freelancer_skill
             FROM booking_request br
             LEFT JOIN customer c ON br.customer_id = c.customer_id
             LEFT JOIN user u ON c.user_id = u.user_id
             LEFT JOIN freelancer_profile fp ON br.freelancer_id = fp.freelancer_id
             LEFT JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
             LEFT JOIN booking b ON br.request_id = b.request_id
             LEFT JOIN review r ON b.booking_id = r.booking_id`
        );

        return attachRequestedTimes(rows);
    } catch (error) {
        console.error("getAll error:", error);
        return [];
    }
};

exports.getByCustomer = async (customer_id) => {
    try {
        await ensureNegotiationColumn();
        await ensureBookingAuditColumns();

        const [rows] = await pool.execute(
            `SELECT
               br.request_id,
               br.freelancer_id,
               br.customer_id,
               br.requested_on,
               br.requested_at,
               br.completed_at,
               br.requested_date,
               br.requested_time,
               br.max_price,
               br.freelancer_proposed_price,
               br.requirements,
               br.status,
               b.booking_id,
               b.final_price,
               b.booked_date,
               b.booked_time,
               b.accepted_on,
               b.accepted_at,
               r.review_id,
               u.name AS freelancer_name,
               fs.skill_name AS freelancer_skill
             FROM booking_request br
             LEFT JOIN freelancer_profile fp ON br.freelancer_id = fp.freelancer_id
             LEFT JOIN user u ON fp.user_id = u.user_id
             LEFT JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
             LEFT JOIN booking b ON br.request_id = b.request_id
             LEFT JOIN review r ON b.booking_id = r.booking_id
             WHERE br.customer_id = ?`,
            [customer_id]
        );

        return attachRequestedTimes(rows);
    } catch (error) {
        console.error("getByCustomer error:", error);
        return [];
    }
};

exports.getByStatus = async (status) => {
    try {
        await ensureNegotiationColumn();
        await ensureBookingAuditColumns();

        const [rows] = await pool.execute(
            `SELECT br.*,
                    uc.name AS customer_name,
                    uf.name AS freelancer_name,
                    fs.skill_name AS freelancer_skill
             FROM booking_request br
             LEFT JOIN customer c ON br.customer_id = c.customer_id
             LEFT JOIN user uc ON c.user_id = uc.user_id
             LEFT JOIN freelancer_profile fp ON br.freelancer_id = fp.freelancer_id
             LEFT JOIN user uf ON fp.user_id = uf.user_id
             LEFT JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
             WHERE br.status = ?
             ORDER BY br.requested_on DESC`,
            [status]
        );
        return rows || [];
    } catch (error) {
        console.error("getByStatus error:", error);
        return [];
    }
};

exports.updateStatus = async (id, status) => {
    try {
        const booking = await exports.getById(id);
        if (!booking) return 0;

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [res] = await conn.execute(
                `UPDATE booking_request SET status = ? WHERE request_id = ?`,
                [status, id]
            );

            // If rejected or cancelled, free up all slots
            if (status === "rejected" || status === "cancelled") {
                const slotHours = booking.requested_times || [Number(String(booking.requested_time || "0:00").split(":")[0])];
                
                for (const slotHour of slotHours) {
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
            }

            await conn.commit();
            return res.affectedRows;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("updateStatus error:", error);
        throw error;
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
    try {
        await ensureNegotiationColumn();
        await ensureBookingAuditColumns();

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [rows] = await conn.execute(
                `SELECT * FROM booking_request WHERE request_id = ? FOR UPDATE`,
                [requestId]
            );
            const request = rows && rows[0];

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
                `UPDATE booking
                 SET accepted_at = CURRENT_TIMESTAMP
                 WHERE request_id = ?`,
                [requestId]
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
    } catch (error) {
        console.error("accept error:", error);
        throw error;
    }
};

exports.getBookedSlots = async (freelancer_id, date) => {
    try {
        const [rows] = await pool.execute(
            `SELECT requested_time
             FROM booking_request
             WHERE freelancer_id = ?
               AND requested_date = ?
               AND status = 'accepted'`,
            [freelancer_id, date]
        );
        return rows || [];
    } catch (error) {
        console.error("getBookedSlots error:", error);
        return [];
    }
};

exports.markCompleted = async (requestId, freelancerId) => {
    const booking = await exports.getById(requestId);
    if (!booking) throw new Error("NOT_FOUND");
    if (booking.status !== "accepted") throw new Error("INVALID_STATUS");
    if (booking.freelancer_id !== freelancerId) throw new Error("UNAUTHORIZED");

    await ensureBookingAuditColumns();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.execute(
            `UPDATE booking_request
             SET status = 'completed',
                 completed_at = CURRENT_TIMESTAMP
             WHERE request_id = ?`,
            [requestId]
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

exports.delete = async (id) => {
    try {
        // Get booking info first
        const booking = await exports.getById(id);
        if (!booking) return 0;

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Free up all slots
            const slotHours = booking.requested_times || [Number(String(booking.requested_time || "0:00").split(":")[0])];
            for (const slotHour of slotHours) {
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

            // Delete the booking request
            const [res] = await conn.execute(
                `DELETE FROM booking_request WHERE request_id = ?`,
                [id]
            );

            await conn.commit();
            return res.affectedRows;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("delete error:", error);
        throw error;
    }
};

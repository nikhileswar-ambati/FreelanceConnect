const pool = require("../config/db");
 
/**
 * Creates a new user and automatically creates a linked customer record
 * if the role is 'customer'. Freelancers create their profile separately.
 * Returns the new user_id.
 */
exports.create = async ({ name, email, password, phone, role, location_id }) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
 
        const [res] = await conn.execute(
            `INSERT INTO user (name, email, password, phone, role, location_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, password, phone, role, location_id]
        );
        const userId = res.insertId;
 
        // Auto-provision a customer record so customer_id is available immediately
        if (role === "customer") {
            await conn.execute(`INSERT INTO customer (user_id) VALUES (?)`, [userId]);
        }
 
        await conn.commit();
        return userId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
 
/**
 * Finds a user by email for login.
 * JOINs with location, customer, and freelancer_profile to retrieve
 * role-specific IDs (customer_id / freelancer_id) for JWT payload.
 */
exports.findByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT u.user_id, u.name, u.email, u.password, u.role, u.phone, u.location_id, u.is_active,
                l.city, l.locality_name,
                c.customer_id,
                fp.freelancer_id
         FROM user u
         JOIN location l ON u.location_id = l.location_id
         LEFT JOIN customer c ON u.user_id = c.user_id
         LEFT JOIN freelancer_profile fp ON u.user_id = fp.user_id
         WHERE u.email = ?`,
        [email]
    );
    return rows[0] || null;
};
 
/**
 * Finds a user by ID, excluding the password.
 * Used internally for profile lookups and token validation.
 */
exports.findById = async (id) => {
    const [rows] = await pool.execute(
        `SELECT u.user_id, u.name, u.email, u.role, u.phone, u.created_on,
                l.city, l.locality_name, l.location_id,
                c.customer_id,
                fp.freelancer_id
         FROM user u
         JOIN location l ON u.location_id = l.location_id
         LEFT JOIN customer c ON u.user_id = c.user_id
         LEFT JOIN freelancer_profile fp ON u.user_id = fp.user_id
         WHERE u.user_id = ?`,
        [id]
    );
    return rows[0] || null;
};

const pool = require("../config/db");
 
/**
 * Creates a new freelancer profile.
 * The user must already exist with role = 'freelancer'.
 */
exports.create = async ({ user_id, experience, bio, starting_price, skill_id }) => {
    const [res] = await pool.execute(
        `INSERT INTO freelancer_profile (user_id, experience_yrs, bio, starting_price, skill_id)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, experience ?? null, bio ?? null, starting_price, skill_id]
    );
    return res.insertId;
};
 
/**
 * Gets a single freelancer profile with full details via JOINs.
 * Includes user name, skill, availability, and location.
 */
exports.getById = async (id) => {
    const [rows] = await pool.execute(
        `SELECT 
  fp.freelancer_id,
  fp.user_id,
  u.name,
  u.email,
  u.phone,
  u.location_id,
  fp.bio,
  fp.starting_price,
  fp.avg_rating,
  fp.total_reviews,
  fp.experience_yrs,
  fs.skill_name
FROM freelancer_profile fp
JOIN user u ON fp.user_id = u.user_id
JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
WHERE fp.freelancer_id = ?`,
        [id]
    );
    return rows[0] || null;
};
 
/**
 * Updates a freelancer profile.
 * Only updatable fields: experience_yrs, bio, starting_price.
 * Skill and availability updates require separate DB entries (by design).
 */
exports.update = async (id, { experience, bio, starting_price }) => {
    const [res] = await pool.execute(
        `UPDATE freelancer_profile
         SET experience_yrs = COALESCE(?, experience_yrs),
             bio = COALESCE(?, bio),
             starting_price = COALESCE(?, starting_price),
             last_active = CURRENT_TIMESTAMP
         WHERE freelancer_id = ?`,
        [experience ?? null, bio ?? null, starting_price ?? null, id]
    );
    return res.affectedRows;
};
 
/**
 * Deletes a freelancer profile.
 * Cascade DELETE in the schema handles linked bookings and reviews.
 */
exports.delete = async (id) => {
    const [res] = await pool.execute(
        `DELETE FROM freelancer_profile WHERE freelancer_id = ?`,
        [id]
    );
    return res.affectedRows;
};
 
/**
 * Searches freelancers with optional filters: location, skill, min experience.
 * Supports pagination via LIMIT and OFFSET.
 */
exports.search = async ({ location_id, skill_id, min_experience, limit, offset }) => {
    let query = `
        SELECT 
  fp.freelancer_id,
  fp.user_id,
  u.name,
  u.email,
  u.phone,
  fp.bio,
  fp.starting_price,
  fp.avg_rating,
  fp.total_reviews,
  fp.experience_yrs,
  fs.skill_name,
  l.city,
  l.locality_name
FROM freelancer_profile fp
JOIN user u ON fp.user_id = u.user_id
JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
JOIN location l ON u.location_id = l.location_id
WHERE 1=1`;
    const values = [];
 
    if (location_id) {
        query += ` AND u.location_id = ?`;
        values.push(location_id);
    }
    if (skill_id) {
        query += ` AND fp.skill_id = ?`;
        values.push(skill_id);
    }
    if (min_experience !== null && min_experience !== undefined) {
        query += ` AND fp.experience_yrs >= ?`;
        values.push(min_experience);
    }
 
    query += ` ORDER BY fp.avg_rating DESC, fp.total_reviews DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
 
    const [rows] = await pool.execute(query, values);
    return rows;
};

const pool = require("../config/db");
 
/**
 * Creates a new review. Also updates the freelancer's avg_rating
 * and total_reviews in freelancer_profile for fast reads.
 */
exports.create = async ({ booking_id, freelancer_id, rating, comments }) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
 
        const [res] = await conn.execute(
            `INSERT INTO review (booking_id, freelancer_id, rating, comments, review_date)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [booking_id, freelancer_id, rating, comments ?? null]
        );
        const reviewId = res.insertId;
 
        // Keep denormalized avg_rating and total_reviews in sync
        await conn.execute(
            `UPDATE freelancer_profile
             SET total_reviews = total_reviews + 1,
                 avg_rating = (
                     SELECT ROUND(AVG(rating), 2) FROM review WHERE freelancer_id = ?
                 )
             WHERE freelancer_id = ?`,
            [freelancer_id, freelancer_id]
        );
 
        await conn.commit();
        return reviewId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
 
/**
 * Gets a single review by ID.
 * Also fetches the customer_id via booking join — needed for ownership checks.
 */
exports.getById = async (id) => {
    const [rows] = await pool.execute(
        `SELECT r.*,
                br.customer_id,
                u.name AS reviewer_name
         FROM review r
         JOIN booking b ON r.booking_id = b.booking_id
         JOIN booking_request br ON b.request_id = br.request_id
         JOIN customer c ON br.customer_id = c.customer_id
         JOIN user u ON c.user_id = u.user_id
         WHERE r.review_id = ?`,
        [id]
    );
    return rows[0] || null;
};
 
/**
 * Checks if a review already exists for a given booking (via booking_id in booking table).
 * The schema has a UNIQUE KEY on booking_id in review.
 */
exports.getByBookingId = async (booking_id) => {
    const [rows] = await pool.execute(
        `SELECT review_id FROM review WHERE booking_id = ?`,
        [booking_id]
    );
    return rows[0] || null;
};
 
/**
 * Gets all reviews for a specific freelancer, newest first.
 * Includes reviewer name for display.
 */
exports.getByFreelancer = async (freelancer_id) => {
    const [rows] = await pool.execute(
        `SELECT r.review_id, r.rating, r.comments, r.review_date,
                u.name AS reviewer_name
         FROM review r
         JOIN booking b ON r.booking_id = b.booking_id
         JOIN booking_request br ON b.request_id = br.request_id
         JOIN customer c ON br.customer_id = c.customer_id
         JOIN user u ON c.user_id = u.user_id
         WHERE r.freelancer_id = ?
         ORDER BY r.review_date DESC`,
        [freelancer_id]
    );
    return rows;
};
 
/**
 * Updates a review's rating and/or comments.
 * Also recalculates avg_rating in freelancer_profile.
 */
exports.update = async (id, freelancer_id, { rating, comments }) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
 
        await conn.execute(
            `UPDATE review
             SET rating = COALESCE(?, rating),
                 comments = COALESCE(?, comments)
             WHERE review_id = ?`,
            [rating ?? null, comments ?? null, id]
        );
 
        // Recalculate avg_rating after update
        await conn.execute(
            `UPDATE freelancer_profile
             SET avg_rating = (
                 SELECT ROUND(AVG(rating), 2) FROM review WHERE freelancer_id = ?
             )
             WHERE freelancer_id = ?`,
            [freelancer_id, freelancer_id]
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
 
/**
 * Deletes a review and recalculates the freelancer's avg_rating.
 */
exports.delete = async (id, freelancer_id) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
 
        await conn.execute(`DELETE FROM review WHERE review_id = ?`, [id]);
 
        await conn.execute(
            `UPDATE freelancer_profile
             SET total_reviews = GREATEST(total_reviews - 1, 0),
                 avg_rating = COALESCE(
                     (SELECT ROUND(AVG(rating), 2) FROM review WHERE freelancer_id = ?),
                     0.00
                 )
             WHERE freelancer_id = ?`,
            [freelancer_id, freelancer_id]
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
 
/**
 * Returns the average rating and total review count for a freelancer.
 */
exports.getAverage = async (freelancer_id) => {
    const [rows] = await pool.execute(
        `SELECT ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS total_reviews
         FROM review
         WHERE freelancer_id = ?`,
        [freelancer_id]
    );
    return rows[0];
};
 
/**
 * Returns the top 5 freelancers ranked by average rating, then review count.
 */
exports.getTop = async () => {
    const [rows] = await pool.execute(
        `SELECT r.freelancer_id, u.name,
                ROUND(AVG(r.rating), 2) AS avg_rating,
                COUNT(*) AS total_reviews,
                fp.starting_price, fs.skill_name
         FROM review r
         JOIN freelancer_profile fp ON r.freelancer_id = fp.freelancer_id
         JOIN user u ON fp.user_id = u.user_id
         JOIN freelancer_skill fs ON fp.skill_id = fs.skill_id
         GROUP BY r.freelancer_id, u.name, fp.starting_price, fs.skill_name
         ORDER BY avg_rating DESC, total_reviews DESC
         LIMIT 5`
    );
    return rows;
};

exports.updateFreelancerRating = async (freelancer_id) => {
  await pool.execute(`
    UPDATE freelancer_profile
    SET 
      avg_rating = (
        SELECT IFNULL(AVG(rating), 0)
        FROM review
        WHERE freelancer_id = ?
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM review
        WHERE freelancer_id = ?
      )
    WHERE freelancer_id = ?
  `, [freelancer_id, freelancer_id, freelancer_id]);
};

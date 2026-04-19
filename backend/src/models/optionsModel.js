const pool = require("../config/db");

exports.getLocations = async () => {
    const [rows] = await pool.execute(
        `SELECT location_id, city, locality_name
         FROM location
         ORDER BY city ASC, locality_name ASC`
    );
    return rows;
};

exports.getSkills = async () => {
    const [rows] = await pool.execute(
        `SELECT skill_id, skill_name
         FROM freelancer_skill
         ORDER BY skill_name ASC`
    );
    return rows;
};

exports.getAvailability = async () => {
    return [];
};

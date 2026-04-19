const mysql = require("mysql2/promise");
 
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "freelance_connect",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
 
// Verify connection on startup
pool.getConnection()
    .then((conn) => {
        console.log("✅ MySQL connected successfully");
        conn.release();
    })
    .catch((err) => {
        console.error("❌ MySQL connection failed:", err.message);
        process.exit(1);
    });
 
module.exports = pool;
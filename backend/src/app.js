require("dotenv").config();
const express = require("express");
const cors = require("cors");
const AppError = require("./utils/AppError");
const errorMiddleware = require("./middleware/errorMiddleware");
const pool = require("./config/db");

// Route imports
const authRoutes = require("./routes/authRoutes");
const freelancerRoutes = require("./routes/freelancerRoutes");
const bookingRoutes = require("./routes/bookingsRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const optionsRoutes = require("./routes/optionsRoutes");

const app = express();

// ─────────────────────────────────────────────
// Initialize Database Tables
// ─────────────────────────────────────────────
const ensureTables = async () => {
    try {
        // Ensure booking_request_time_slots table exists
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
            console.log("✅ Created booking_request_time_slots table");
        }
    } catch (err) {
        console.error("Failed to ensure tables:", err.message);
    }
};

// Call ensure tables on startup
ensureTables().catch(err => console.error("Table initialization error:", err));

// ─────────────────────────────────────────────
// Global Middleware
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.get("/", (req, res) =>
    res.json({ success: true, message: "Freelance Connect API is running." })
);
 
app.use("/api/auth", authRoutes);
app.use("/api/freelancer", freelancerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/options", optionsRoutes);
 
// ─────────────────────────────────────────────
// 404 Handler — for any unmatched routes
// ─────────────────────────────────────────────
app.use((req, res, next) => {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});
 
// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use(errorMiddleware);
 
// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
 
module.exports = app;

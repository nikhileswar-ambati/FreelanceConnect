require("dotenv").config();
const express = require("express");
const cors = require("cors");
const AppError = require("./utils/AppError");
const errorMiddleware = require("./middleware/errorMiddleware");
 
// Route imports
const authRoutes = require("./routes/authRoutes");
const freelancerRoutes = require("./routes/freelancerRoutes");
const bookingRoutes = require("./routes/bookingsRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const optionsRoutes = require("./routes/optionsRoutes");
 
const app = express();
 
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

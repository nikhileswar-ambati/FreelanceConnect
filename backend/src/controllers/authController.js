const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const userModel = require("../models/userModel");
const { requireFields } = require("../utils/validators");
 
const SALT_ROUNDS = 12;
 
// ─────────────────────────────────────────────
// SIGN UP
// ─────────────────────────────────────────────
exports.signup = asyncHandler(async (req, res) => {
    const { name, email, password, phone, role, location_id } = req.body;
 
    // Validate all required fields
    requireFields(req.body, ["name", "email", "password", "phone", "role", "location_id"]);
 
    // Email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError("Invalid email format.", 400);
    }
 
    // Role must be one of the two valid options
    if (!["customer", "freelancer"].includes(role)) {
        throw new AppError("Role must be 'customer' or 'freelancer'.", 400);
    }
 
    // Password strength
    if (password.length < 6) {
        throw new AppError("Password must be at least 6 characters.", 400);
    }
 
    // Phone format (basic: digits only, 7–15 chars)
    if (!/^\d{7,15}$/.test(phone)) {
        throw new AppError("Invalid phone number. Use 7–15 digits only.", 400);
    }
 
    // Duplicate check
    const existing = await userModel.findByEmail(email);
    if (existing) {
        throw new AppError("An account with this email already exists.", 409);
    }
 
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
 
    const userId = await userModel.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone,
        role,
        location_id,
    });
 
    res.status(201).json({
        success: true,
        message: "Account created successfully.",
        user_id: userId,
    });
});
 
// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
 
    requireFields(req.body, ["email", "password"]);
 
    const user = await userModel.findByEmail(email.toLowerCase().trim());
 
    // Use a generic message to prevent email enumeration attacks
    if (!user) {
        throw new AppError("Invalid email or password.", 401);
    }
 
    if (!user.is_active) {
        throw new AppError("This account has been deactivated. Please contact support.", 403);
    }
 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError("Invalid email or password.", 401);
    }
 
    // Build JWT payload — includes role-specific IDs so controllers never
    // need to do an extra DB lookup just to get customer_id / freelancer_id.
    const payload = {
        id: user.user_id,
        user_id: user.user_id,
        role: user.role,
        customer_id: user.customer_id || null,
        freelancer_id: user.freelancer_id || null,
    };
 
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
 
    res.json({
        success: true,
        message: "Login successful.",
        token,
        user: {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            location_id: user.location_id,
            customer_id: user.customer_id || null,
            freelancer_id: user.freelancer_id || null,
        },
    });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const barberRoutes_1 = __importDefault(require("./routes/barberRoutes"));
const app = (0, express_1.default)();
console.log("=== ENVIRONMENT DEBUG ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT from env:", process.env.PORT);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
console.log("========================");
app.use((0, cors_1.default)({
    origin: [
        /\.vercel(?:\.app|-preview\.app)$/,
        "https://cuthair.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://cutcut.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
    ],
    optionsSuccessStatus: 200,
}));
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "CutCut API is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        version: "2.0.0",
    });
});
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "CutCut API is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});
app.use("/user", userRoutes_1.default);
app.use("/barber", barberRoutes_1.default);
app.get("/debug", (req, res) => {
    res.json({
        origin: req.headers.origin,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        message: "CutCut API Debug Info",
        routes: {
            user: [
                "POST /user/signup - Phone + Name signup",
                "POST /user/signin - Phone signin",
                "POST /user/joinqueue - Join barber queue with service",
                "POST /user/leavequeue - Leave current queue",
                "GET /user/queue-status - Get current queue status",
                "POST /user/barbers - Get nearby barbers",
            ],
            barber: [
                "POST /barber/signup - Barber registration",
                "POST /barber/signin - Barber login",
                "GET /barber/queue - Get barber's queue",
                "POST /barber/remove-user - Remove user from queue",
                "GET /barber/stats - Get barber statistics",
            ],
        },
        supportedServices: ["haircut", "beard", "haircut+beard"],
    });
});
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong",
        timestamp: new Date().toISOString(),
    });
});
app.use("*", (req, res) => {
    res.status(404).json({
        error: "Route not found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableRoutes: {
            user: "/user/*",
            barber: "/barber/*",
            health: "/health",
            debug: "/debug",
        },
        timestamp: new Date().toISOString(),
    });
});
const PORT = process.env.PORT || 3000;
console.log("Attempting to start server on 0.0.0.0:" + PORT);
app.listen(PORT, () => {
    console.log(`✅ Server successfully listening on 0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 API Documentation: http://localhost:${PORT}/debug`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});
//# sourceMappingURL=index.js.map
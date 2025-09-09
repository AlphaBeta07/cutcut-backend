"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userServices_1 = require("../services/userServices");
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./middleware/auth");
const userRouter = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const getErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    return String(error);
};
const getErrorCode = (error) => {
    if (typeof error === "object" && error !== null && "code" in error) {
        return error.code;
    }
    return undefined;
};
userRouter.post("/signup", async (req, res) => {
    try {
        console.log("User signup request received:", {
            body: req.body,
            headers: req.headers.origin,
        });
        const { name, phoneNumber } = req.body;
        if (!name || !phoneNumber) {
            console.log("Missing fields in signup request");
            res.status(400).json({ error: "Name and phone number are required." });
            return;
        }
        const cleanPhone = phoneNumber.replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
            res
                .status(400)
                .json({ error: "Phone number must be exactly 10 digits." });
            return;
        }
        if (!/^[6-9]/.test(cleanPhone)) {
            res
                .status(400)
                .json({ error: "Phone number must start with 6, 7, 8, or 9." });
            return;
        }
        const user = await (0, userServices_1.createUser)(name, cleanPhone);
        const token = jsonwebtoken_1.default.sign({ sub: user.id, phoneNumber: user.phoneNumber }, JWT_SECRET, {
            expiresIn: "8h",
        });
        console.log("User signup successful:", {
            userId: user.id,
            phoneNumber: user.phoneNumber,
        });
        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phoneNumber,
            },
            msg: "User created successfully",
            token,
        });
    }
    catch (error) {
        console.error("User signup error:", error);
        if (getErrorCode(error) === "P2002") {
            res.status(409).json({ msg: "Phone number already exists" });
            return;
        }
        res.status(500).json({
            msg: "Error occurred during sign up",
            error: getErrorMessage(error),
        });
    }
});
userRouter.post("/signin", async (req, res) => {
    try {
        console.log("User signin request received:", {
            phoneNumber: req.body.phoneNumber,
            origin: req.headers.origin,
        });
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            console.log("Missing phone number in signin request");
            res.status(400).json({ error: "Phone number is required." });
            return;
        }
        const cleanPhone = phoneNumber.replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
            res
                .status(400)
                .json({ error: "Phone number must be exactly 10 digits." });
            return;
        }
        if (!/^[6-9]/.test(cleanPhone)) {
            res
                .status(400)
                .json({ error: "Phone number must start with 6, 7, 8, or 9." });
            return;
        }
        console.log("Attempting to authenticate user:", cleanPhone);
        const user = await (0, userServices_1.authenticateUser)(cleanPhone);
        if (!user) {
            console.log("Authentication failed for user:", cleanPhone);
            res
                .status(401)
                .json({ msg: "Phone number not found. Please sign up first." });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ sub: user.id, phoneNumber: user.phoneNumber }, JWT_SECRET, {
            expiresIn: "8h",
        });
        console.log("User signin successful:", {
            userId: user.id,
            phoneNumber: user.phoneNumber,
            name: user.name,
        });
        res.json({
            user,
            msg: "User Signed In Successfully",
            token,
        });
    }
    catch (error) {
        console.error("User signin error:", error);
        res.status(500).json({
            msg: "Error occurred during sign in",
            error: getErrorMessage(error),
        });
    }
});
userRouter.post("/joinqueue", auth_1.authenticateJWT, async (req, res) => {
    try {
        const { barberId, service } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "User not authenticated" });
            return;
        }
        if (!barberId) {
            res.status(400).json({ error: "Barber ID is required" });
            return;
        }
        if (!service) {
            res.status(400).json({ error: "Service type is required" });
            return;
        }
        const validServices = ["haircut", "beard", "haircut+beard"];
        if (!validServices.includes(service)) {
            res.status(400).json({
                error: "Invalid service type. Must be one of: haircut, beard, haircut+beard",
            });
            return;
        }
        const queueEntry = await (0, userServices_1.joinQueue)(barberId, userId, service);
        res.json({
            msg: `You have joined the queue for ${service}`,
            queue: queueEntry,
        });
    }
    catch (error) {
        console.error("Join queue error:", error);
        res
            .status(500)
            .json({ msg: "Error joining queue", error: getErrorMessage(error) });
    }
});
userRouter.post("/leavequeue", auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "User not authenticated" });
            return;
        }
        const result = await (0, userServices_1.removeFromQueue)(userId);
        if (!result.success) {
            res.status(400).json({ msg: result.message });
            return;
        }
        res.json({
            msg: "You have been removed from the queue",
            data: result.data,
        });
    }
    catch (error) {
        console.error("Leave queue error:", error);
        res
            .status(500)
            .json({ msg: "Error leaving queue", error: getErrorMessage(error) });
    }
});
userRouter.get("/queue-status", auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "User not authenticated" });
            return;
        }
        const queueStatus = await (0, userServices_1.getUserQueueStatus)(userId);
        res.json({
            msg: "Queue status retrieved successfully",
            queueStatus: queueStatus,
        });
    }
    catch (error) {
        console.error("Queue status error:", error);
        res.status(500).json({
            msg: "Error getting queue status",
            error: getErrorMessage(error),
        });
    }
});
userRouter.post("/barbers", auth_1.authenticateJWT, async (req, res) => {
    try {
        const { lat, long, radius } = req.body;
        console.log("Get barbers request received:");
        if (!lat || !long) {
            res.status(400).json({ error: "Latitude and longitude are required" });
            return;
        }
        const latitude = parseFloat(lat);
        const longitude = parseFloat(long);
        const searchRadius = radius ? parseFloat(radius) : 10;
        if (isNaN(latitude) || isNaN(longitude)) {
            res.status(400).json({ error: "Invalid latitude or longitude values" });
            return;
        }
        const barbers = await (0, userServices_1.getBarbersNearby)(latitude, longitude, searchRadius);
        res.json({
            barbers,
            msg: `Found ${barbers.length} barbers within ${searchRadius}km`,
        });
    }
    catch (error) {
        console.error("Get barbers error:", error);
        res.status(500).json({
            msg: "Error getting nearby barbers",
            error: getErrorMessage(error),
        });
    }
});
exports.default = userRouter;
//# sourceMappingURL=userRoutes.js.map
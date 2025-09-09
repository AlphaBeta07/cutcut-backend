"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBarber = createBarber;
exports.authenticateBarber = authenticateBarber;
exports.getQueue = getQueue;
exports.removeUserFromQueue = removeUserFromQueue;
exports.getBarberStats = getBarberStats;
const db_1 = __importDefault(require("../db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function createBarber(name, username, password, lat, long) {
    try {
        console.log("Creating barber with data:", {
            name,
            username,
            lat,
            long,
        });
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const barber = await db_1.default.barber.create({
            data: { name, username, passwordHash, lat, long },
        });
        console.log("Barber created:", barber);
        return {
            id: barber.id,
            name: barber.name,
            username: barber.username,
            lat: barber.lat,
            long: barber.long,
        };
    }
    catch (error) {
        console.error("Error creating barber:", error);
        throw error;
    }
}
async function authenticateBarber(username, password) {
    try {
        const barber = await db_1.default.barber.findUnique({ where: { username } });
        if (!barber)
            return null;
        const valid = await bcrypt_1.default.compare(password, barber.passwordHash);
        if (!valid)
            return null;
        return {
            id: barber.id,
            name: barber.name,
            username: barber.username,
            lat: barber.lat,
            long: barber.long,
        };
    }
    catch (error) {
        console.error("Error authenticating barber:", error);
        throw new Error("Failed to authenticate barber");
    }
}
async function getQueue(barberId) {
    try {
        const barber = await db_1.default.barber.findUnique({
            where: { id: barberId },
        });
        if (!barber) {
            throw new Error("Barber not found");
        }
        return db_1.default.queue.findMany({
            where: { barberId },
            orderBy: { enteredAt: "asc" },
            include: {
                user: { select: { id: true, name: true, phoneNumber: true } },
            },
        });
    }
    catch (error) {
        console.error("Error getting queue:", error);
        throw new Error("Failed to get queue");
    }
}
async function removeUserFromQueue(barberId, userId) {
    try {
        const queueEntry = await db_1.default.queue.findUnique({
            where: { userId },
            include: {
                user: { select: { id: true, name: true, phoneNumber: true } },
                barber: { select: { id: true, name: true } },
            },
        });
        if (!queueEntry) {
            return {
                success: false,
                message: "User is not in any queue",
                data: null,
            };
        }
        if (queueEntry.barberId !== barberId) {
            return {
                success: false,
                message: "You can only remove users from your own queue",
                data: null,
            };
        }
        await db_1.default.serviceHistory.create({
            data: {
                barberId: barberId,
                userId: userId,
                service: queueEntry.service,
            },
        });
        await db_1.default.$transaction([
            db_1.default.queue.delete({ where: { userId } }),
            db_1.default.user.update({
                where: { id: userId },
                data: { inQueue: false, queuedBarberId: null },
            }),
        ]);
        return {
            success: true,
            message: "User served and removed from queue successfully",
            data: {
                user: queueEntry.user,
                service: queueEntry.service,
                servedAt: new Date(),
            },
        };
    }
    catch (error) {
        console.error("Error removing user from queue:", error);
        throw new Error("Failed to remove user from queue");
    }
}
async function getBarberStats(barberId) {
    try {
        const barber = await db_1.default.barber.findUnique({
            where: { id: barberId },
        });
        if (!barber) {
            throw new Error("Barber not found");
        }
        const currentQueue = await db_1.default.queue.count({
            where: { barberId },
        });
        const totalServiced = await db_1.default.serviceHistory.count({
            where: { barberId },
        });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayServiced = await db_1.default.serviceHistory.count({
            where: {
                barberId,
                servedAt: { gte: todayStart },
            },
        });
        const recentServices = await db_1.default.serviceHistory.findMany({
            where: { barberId },
            orderBy: { servedAt: "desc" },
            take: 10,
            include: {
                user: { select: { id: true, name: true, phoneNumber: true } },
            },
        });
        return {
            currentQueueLength: currentQueue,
            totalCustomersServiced: totalServiced,
            todayCustomersServiced: todayServiced,
            estimatedWaitTime: currentQueue * 15,
            recentServices,
        };
    }
    catch (error) {
        console.error("Error getting barber stats:", error);
        throw new Error("Failed to get barber statistics");
    }
}
//# sourceMappingURL=barberServices.js.map
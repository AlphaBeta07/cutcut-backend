"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.authenticateUser = authenticateUser;
exports.joinQueue = joinQueue;
exports.removeFromQueue = removeFromQueue;
exports.getUserQueueStatus = getUserQueueStatus;
exports.getBarbersNearby = getBarbersNearby;
const db_1 = __importDefault(require("../db"));
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
async function createUser(name, phoneNumber) {
    try {
        console.log("Creating user:", { name, phoneNumber });
        const user = await db_1.default.user.create({ data: { name, phoneNumber } });
        console.log("User created:", user);
        return { id: user.id, name: user.name, phoneNumber: user.phoneNumber };
    }
    catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}
async function authenticateUser(phoneNumber) {
    try {
        const user = await db_1.default.user.findUnique({ where: { phoneNumber } });
        if (!user)
            return null;
        return { id: user.id, name: user.name, phoneNumber: user.phoneNumber };
    }
    catch (error) {
        console.error("Error authenticating user:", error);
        throw new Error("Failed to authenticate user");
    }
}
async function joinQueue(barberId, userId, service) {
    try {
        const barber = await db_1.default.barber.findUnique({ where: { id: barberId } });
        if (!barber)
            throw new Error("Barber not found");
        const validServices = ["haircut", "beard", "haircut+beard"];
        if (!validServices.includes(service)) {
            throw new Error("Invalid service type");
        }
        const [, , entry] = await db_1.default.$transaction([
            db_1.default.queue.deleteMany({ where: { userId } }),
            db_1.default.user.update({
                where: { id: userId },
                data: { inQueue: false, queuedBarberId: null },
            }),
            db_1.default.queue.create({
                data: { barberId, userId, service },
                include: {
                    user: { select: { id: true, name: true, phoneNumber: true } },
                    barber: { select: { id: true, name: true } },
                },
            }),
            db_1.default.user.update({
                where: { id: userId },
                data: { inQueue: true, queuedBarberId: barberId },
            }),
        ]);
        return entry;
    }
    catch (error) {
        console.error("Error joining queue:", error);
        throw new Error("Failed to join queue");
    }
}
async function removeFromQueue(userId) {
    try {
        const existingQueueEntry = await db_1.default.queue.findUnique({
            where: { userId },
            include: {
                barber: { select: { id: true, name: true } },
            },
        });
        if (!existingQueueEntry) {
            return {
                success: false,
                message: "User is not in any queue",
                data: null,
            };
        }
        await db_1.default.$transaction([
            db_1.default.queue.delete({ where: { userId } }),
            db_1.default.user.update({
                where: { id: userId },
                data: { inQueue: false, queuedBarberId: null },
            }),
        ]);
        return {
            success: true,
            message: "Successfully removed from queue",
            data: {
                barberId: existingQueueEntry.barberId,
                barberName: existingQueueEntry.barber.name,
            },
        };
    }
    catch (error) {
        console.error("Error removing from queue:", error);
        throw new Error("Failed to remove from queue");
    }
}
async function getUserQueueStatus(userId) {
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            include: {
                Queue: {
                    include: {
                        barber: { select: { id: true, name: true, lat: true, long: true } },
                    },
                },
            },
        });
        if (!user)
            throw new Error("User not found");
        if (!user.inQueue || !user.Queue) {
            return {
                inQueue: false,
                queuePosition: null,
                barber: null,
                enteredAt: null,
                service: null,
                estimatedWaitTime: null,
            };
        }
        const countWhere = {
            barberId: user.queuedBarberId,
            ...(user.Queue.enteredAt
                ? { enteredAt: { lt: user.Queue.enteredAt } }
                : {}),
        };
        const queuePosition = await db_1.default.queue.count({ where: countWhere });
        const estimatedWaitMinutes = queuePosition * 15;
        return {
            inQueue: true,
            queuePosition: queuePosition + 1,
            barber: {
                id: user.Queue.barber.id,
                name: user.Queue.barber.name,
                lat: user.Queue.barber.lat,
                long: user.Queue.barber.long,
            },
            enteredAt: user.Queue.enteredAt
                ? user.Queue.enteredAt.toISOString()
                : null,
            service: user.Queue.service || "haircut",
            estimatedWaitTime: estimatedWaitMinutes,
        };
    }
    catch (error) {
        console.error("Error getting user queue status:", error);
        throw new Error("Failed to get queue status");
    }
}
async function getBarbersNearby(userLat, userLong, radiusKm) {
    console.log("Getting nearby barbers");
    try {
        const barbers = await db_1.default.barber.findMany({
            include: { queueEntries: { select: { id: true } } },
        });
        const barbersWithDistance = barbers.map((barber) => {
            const distance = calculateDistance(userLat, userLong, barber.lat, barber.long);
            return {
                id: barber.id,
                name: barber.name,
                lat: barber.lat,
                long: barber.long,
                distance: Math.round(distance * 10) / 10,
                queueLength: barber.queueEntries.length,
                estimatedWaitTime: barber.queueEntries.length * 15,
            };
        });
        return barbersWithDistance
            .filter((b) => b.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance);
    }
    catch (error) {
        console.error("Error getting nearby barbers:", error);
        throw new Error("Failed to get nearby barbers");
    }
}
//# sourceMappingURL=userServices.js.map
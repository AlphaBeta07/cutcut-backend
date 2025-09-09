import { Prisma } from "@prisma/client";
export interface BarberDTO {
    id: number;
    name: string;
    username: string;
    lat: number;
    long: number;
}
export declare function createBarber(name: string, username: string, password: string, lat: number, long: number): Promise<BarberDTO>;
export declare function authenticateBarber(username: string, password: string): Promise<BarberDTO | null>;
export declare function getQueue(barberId: number): Promise<Prisma.QueueGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                name: true;
                phoneNumber: true;
            };
        };
    };
}>[]>;
export declare function removeUserFromQueue(barberId: number, userId: number): Promise<{
    success: boolean;
    message: string;
    data: null;
} | {
    success: boolean;
    message: string;
    data: {
        user: {
            name: string;
            phoneNumber: string;
            id: number;
        };
        service: string;
        servedAt: Date;
    };
}>;
export declare function getBarberStats(barberId: number): Promise<{
    currentQueueLength: number;
    totalCustomersServiced: number;
    todayCustomersServiced: number;
    estimatedWaitTime: number;
    recentServices: ({
        user: {
            name: string;
            phoneNumber: string;
            id: number;
        };
    } & {
        id: number;
        userId: number;
        service: string;
        barberId: number;
        servedAt: Date | null;
    })[];
}>;
//# sourceMappingURL=barberServices.d.ts.map
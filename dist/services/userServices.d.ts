export interface UserDTO {
    id: number;
    name: string;
    phoneNumber: string;
}
export declare function createUser(name: string, phoneNumber: string): Promise<UserDTO>;
export declare function authenticateUser(phoneNumber: string): Promise<UserDTO | null>;
export declare function joinQueue(barberId: number, userId: number, service: string): Promise<{
    user: {
        name: string;
        phoneNumber: string;
        id: number;
    };
    barber: {
        name: string;
        id: number;
    };
} & {
    id: number;
    userId: number;
    enteredAt: Date | null;
    service: string;
    barberId: number;
}>;
export declare function removeFromQueue(userId: number): Promise<{
    success: boolean;
    message: string;
    data: null;
} | {
    success: boolean;
    message: string;
    data: {
        barberId: number;
        barberName: string;
    };
}>;
export declare function getUserQueueStatus(userId: number): Promise<{
    inQueue: boolean;
    queuePosition: null;
    barber: null;
    enteredAt: null;
    service: null;
    estimatedWaitTime: null;
} | {
    inQueue: boolean;
    queuePosition: number;
    barber: {
        id: number;
        name: string;
        lat: number;
        long: number;
    };
    enteredAt: string | null;
    service: string;
    estimatedWaitTime: number;
}>;
export declare function getBarbersNearby(userLat: number, userLong: number, radiusKm: number): Promise<{
    id: number;
    name: string;
    lat: number;
    long: number;
    distance: number;
    queueLength: number;
    estimatedWaitTime: number;
}[]>;
//# sourceMappingURL=userServices.d.ts.map
import { Request, Response, NextFunction } from "express";
import "dotenv/config";
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email?: string;
        phoneNumber?: string;
        role?: string;
    };
}
export declare function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map
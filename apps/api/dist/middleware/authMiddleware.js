"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../lib/jwt");
const auth_service_1 = require("../services/auth.service");
async function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization header" });
        return;
    }
    const token = header.slice(7);
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        const user = await (0, auth_service_1.findUserById)(payload.sub);
        if (!user) {
            res.status(401).json({ error: "User not found" });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

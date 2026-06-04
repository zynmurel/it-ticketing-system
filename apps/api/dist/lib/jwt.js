"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not set");
    }
    return secret;
}
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, getJwtSecret());
}

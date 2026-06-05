"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@it-ticketing/shared");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authService = __importStar(require("../services/auth.service"));
const router = (0, express_1.Router)();
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: "email and password are required" });
        return;
    }
    const result = await authService.login(email, password);
    if (!result) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
    }
    res.json(result);
});
router.post("/register", async (req, res) => {
    const { email, password, name, role, departmentId } = req.body;
    if (!email || !password || !name || !role || !departmentId) {
        res.status(400).json({
            error: "email, password, name, role, and departmentId are required",
        });
        return;
    }
    if (!Object.values(shared_1.Role).includes(role)) {
        res.status(400).json({ error: "Invalid role" });
        return;
    }
    try {
        const result = await authService.register({
            email,
            password,
            name,
            role,
            departmentId,
        });
        res.status(201).json(result);
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.message === "EMAIL_IN_USE") {
                res.status(409).json({ error: "Email already registered" });
                return;
            }
            if (err.message === "DEPARTMENT_NOT_FOUND") {
                res.status(400).json({ error: "Department not found" });
                return;
            }
        }
        res.status(500).json({ error: "Registration failed" });
    }
});
router.get("/me", authMiddleware_1.authMiddleware, async (req, res) => {
    const user = await authService.findUserById(req.user.id);
    if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
    }
    res.json({ user });
});
exports.default = router;

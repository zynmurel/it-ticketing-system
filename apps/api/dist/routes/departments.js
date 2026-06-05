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
const authMiddleware_1 = require("../middleware/authMiddleware");
const errors_1 = require("../lib/errors");
const prisma_1 = require("../lib/prisma");
const authService = __importStar(require("../services/auth.service"));
const router = (0, express_1.Router)();
/** Public list for registration department picker */
router.get("/", async (_req, res) => {
    const departments = await prisma_1.prisma.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
    });
    res.json({ departments });
});
router.get("/members", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const members = await authService.listDepartmentMembers(req.user);
        res.json({ members });
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
exports.default = router;

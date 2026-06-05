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
const requireRole_1 = require("../middleware/requireRole");
const errors_1 = require("../lib/errors");
const ticketService = __importStar(require("../services/ticket.service"));
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get("/ticket-types", async (_req, res) => {
    const types = await ticketService.listTicketTypes();
    res.json({ ticketTypes: types });
});
router.get("/my", async (req, res) => {
    const tickets = await ticketService.listMyTickets(req.user);
    res.json({ tickets });
});
router.get("/escalated", async (req, res) => {
    const tickets = await ticketService.listEscalatedTickets(req.user);
    res.json({ tickets });
});
router.get("/department/unassigned", (0, requireRole_1.requireRole)(shared_1.Role.DEPARTMENT_MEMBER), async (req, res) => {
    try {
        const tickets = await ticketService.listDepartmentUnassigned(req.user);
        res.json({ tickets });
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
router.get("/department/assigned", (0, requireRole_1.requireRole)(shared_1.Role.DEPARTMENT_MEMBER), async (req, res) => {
    try {
        const tickets = await ticketService.listDepartmentAssigned(req.user);
        res.json({ tickets });
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
router.get("/department/queue", (0, requireRole_1.requireRole)(shared_1.Role.DEPARTMENT_MEMBER), async (req, res) => {
    try {
        const queue = await ticketService.getDepartmentQueue(req.user);
        res.json(queue);
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
router.get("/:id", async (req, res) => {
    try {
        const ticket = await ticketService.getTicketForActor(req.user, req.params.id);
        res.json({ ticket });
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
router.post("/", async (req, res) => {
    const { title, description, ticketTypeId } = req.body;
    if (!title || !description || !ticketTypeId) {
        res.status(400).json({
            error: "title, description, and ticketTypeId are required",
        });
        return;
    }
    try {
        const ticket = await ticketService.createTicket(req.user, {
            title,
            description,
            ticketTypeId,
        });
        res.status(201).json({ ticket });
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
router.post("/:id/assign", (0, requireRole_1.requireRole)(shared_1.Role.DEPARTMENT_MEMBER), async (req, res) => {
    const { assigneeId } = req.body;
    if (!assigneeId) {
        res.status(400).json({ error: "assigneeId is required" });
        return;
    }
    try {
        const ticket = await ticketService.assignTicket(req.user, req.params.id, assigneeId);
        res.json({ ticket });
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
router.post("/:id/escalate", (0, requireRole_1.requireRole)(shared_1.Role.DEPARTMENT_MEMBER), async (req, res) => {
    const { message } = req.body;
    try {
        const ticket = await ticketService.escalateTicket(req.user, req.params.id, message);
        res.json({ ticket });
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
router.patch("/:id/status", (0, requireRole_1.requireRole)(shared_1.Role.DEPARTMENT_MEMBER), async (req, res) => {
    const { status } = req.body;
    if (!status || !Object.values(shared_1.TicketStatus).includes(status)) {
        res.status(400).json({ error: "Valid status is required" });
        return;
    }
    try {
        const ticket = await ticketService.updateTicketStatus(req.user, req.params.id, status);
        res.json({ ticket });
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
router.post("/:id/remarks", (0, requireRole_1.requireRole)(shared_1.Role.DEPARTMENT_MEMBER), async (req, res) => {
    const { message } = req.body;
    if (!message) {
        res.status(400).json({ error: "message is required" });
        return;
    }
    try {
        const ticket = await ticketService.addTicketRemark(req.user, req.params.id, message);
        res.json({ ticket });
    }
    catch (err) {
        (0, errors_1.sendServiceError)(res, err);
    }
});
exports.default = router;

import { Router } from "express";
import { Role, TicketStatus } from "@it-ticketing/shared";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";
import { sendServiceError } from "../lib/errors";
import * as ticketService from "../services/ticket.service";

const router = Router();

router.use(authMiddleware);

router.get("/ticket-types", async (_req, res) => {
  const types = await ticketService.listTicketTypes();
  res.json({ ticketTypes: types });
});

router.get("/my", async (req, res) => {
  const tickets = await ticketService.listMyTickets(req.user!);
  res.json({ tickets });
});

router.get("/escalated", async (req, res) => {
  const tickets = await ticketService.listEscalatedTickets(req.user!);
  res.json({ tickets });
});

router.get(
  "/department/unassigned",
  requireRole(Role.DEPARTMENT_MEMBER),
  async (req, res) => {
    try {
      const tickets = await ticketService.listDepartmentUnassigned(req.user!);
      res.json({ tickets });
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

router.get(
  "/department/assigned",
  requireRole(Role.DEPARTMENT_MEMBER),
  async (req, res) => {
    try {
      const tickets = await ticketService.listDepartmentAssigned(req.user!);
      res.json({ tickets });
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

router.get(
  "/department/board",
  requireRole(Role.DEPARTMENT_MEMBER),
  async (req, res) => {
    try {
      const board = await ticketService.getDepartmentBoard(req.user!);
      res.json(board);
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

router.get(
  "/department/queue",
  requireRole(Role.DEPARTMENT_MEMBER),
  async (req, res) => {
    try {
      const queue = await ticketService.getDepartmentQueue(req.user!);
      res.json(queue);
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

router.get(
  "/:id/escalation-preview",
  requireRole(Role.DEPARTMENT_MEMBER),
  async (req, res) => {
    try {
      const preview = await ticketService.getEscalationPreview(
        req.user!,
        req.params.id as string,
      );
      res.json(preview);
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

router.get("/:id", async (req, res) => {
  try {
    const ticket = await ticketService.getTicketForActor(
      req.user!,
      req.params.id as string,
    );
    res.json({ ticket });
  } catch (err) {
    sendServiceError(res, err);
  }
});

router.post("/", async (req, res) => {
  const { title, description, ticketTypeId } = req.body as {
    title?: string;
    description?: string;
    ticketTypeId?: string;
  };

  if (!title || !description || !ticketTypeId) {
    res.status(400).json({
      error: "title, description, and ticketTypeId are required",
    });
    return;
  }

  try {
    const ticket = await ticketService.createTicket(req.user!, {
      title,
      description,
      ticketTypeId,
    });
    res.status(201).json({ ticket });
  } catch (err) {
    sendServiceError(res, err);
  }
});

router.post(
  "/:id/assign",
  requireRole(Role.DEPARTMENT_MEMBER),
  async (req, res) => {
    const { assigneeId } = req.body as { assigneeId?: string };
    if (!assigneeId) {
      res.status(400).json({ error: "assigneeId is required" });
      return;
    }

    try {
      const ticket = await ticketService.assignTicket(
        req.user!,
        req.params.id as string,
        assigneeId,
      );
      res.json({ ticket });
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

router.post(
  "/:id/escalate",
  requireRole(Role.DEPARTMENT_MEMBER),
  async (req, res) => {
    const { message } = req.body as { message?: string };

    try {
      const ticket = await ticketService.escalateTicket(
        req.user!,
        req.params.id as string,
        message,
      );
      res.json({ ticket });
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

router.patch(
  "/:id/status",
  requireRole(Role.DEPARTMENT_MEMBER),
  async (req, res) => {
    const { status, message } = req.body as {
      status?: TicketStatus;
      message?: string;
    };
    if (!status || !Object.values(TicketStatus).includes(status)) {
      res.status(400).json({ error: "Valid status is required" });
      return;
    }

    try {
      const ticket = await ticketService.updateTicketStatus(
        req.user!,
        req.params.id as string,
        status,
        message,
      );
      res.json({ ticket });
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

router.post(
  "/:id/remarks",
  requireRole(Role.DEPARTMENT_MEMBER),
  async (req, res) => {
    const { message } = req.body as { message?: string };
    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    try {
      const ticket = await ticketService.addTicketRemark(
        req.user!,
        req.params.id as string,
        message,
      );
      res.json({ ticket });
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

export default router;

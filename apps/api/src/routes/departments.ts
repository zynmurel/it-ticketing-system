import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { sendServiceError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import * as authService from "../services/auth.service";

const router = Router();

/** Public list for registration department picker */
router.get("/", async (_req, res) => {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  res.json({ departments });
});

router.get("/members", authMiddleware, async (req, res) => {
  try {
    const members = await authService.listDepartmentMembers(req.user!);
    res.json({ members });
  } catch (err) {
    sendServiceError(res, err);
  }
});

export default router;

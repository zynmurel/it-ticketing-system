import { Router } from "express";
import { Role } from "@it-ticketing/shared";
import { authMiddleware } from "../middleware/authMiddleware";
import * as authService from "../services/auth.service";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

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
  const { email, password, name, role, departmentId } = req.body as {
    email?: string;
    password?: string;
    name?: string;
    role?: Role;
    departmentId?: string;
  };

  if (!email || !password || !name || !role || !departmentId) {
    res.status(400).json({
      error: "email, password, name, role, and departmentId are required",
    });
    return;
  }

  if (!Object.values(Role).includes(role)) {
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
  } catch (err) {
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

router.get("/me", authMiddleware, async (req, res) => {
  const user = await authService.findUserById(req.user!.id);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

export default router;

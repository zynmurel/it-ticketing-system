import bcrypt from "bcrypt";
import { Role, type AuthUser } from "@it-ticketing/shared";
import { prisma } from "../lib/prisma";
import { signAccessToken } from "../lib/jwt";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  departmentId: true,
  department: { select: { id: true, name: true, slug: true } },
} as const;

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { ...userSelect, passwordHash: true },
  });

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  const { passwordHash: _, ...safeUser } = user;
  const token = signAccessToken({
    sub: safeUser.id,
    email: safeUser.email,
    role: safeUser.role as Role,
  });

  return { user: safeUser, token };
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  role: Role;
  departmentId: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const department = await prisma.department.findUnique({
    where: { id: input.departmentId },
  });
  if (!department) {
    throw new Error("DEPARTMENT_NOT_FOUND");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name.trim(),
      role: input.role,
      departmentId: input.departmentId,
    },
    select: userSelect,
  });

  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role as Role,
  });

  return { user, token };
}

function toAuthUser(
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    departmentId: string;
    department: { id: string; name: string; slug: string };
  },
): AuthUser {
  return { ...user, role: user.role as Role };
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
  if (!user) return null;
  return toAuthUser(user);
}

export async function listDepartmentMembers(actor: AuthUser) {
  if (actor.role !== "DEPARTMENT_MEMBER") {
    throw new Error("FORBIDDEN");
  }

  return prisma.user.findMany({
    where: { departmentId: actor.departmentId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

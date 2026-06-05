"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
exports.findUserById = findUserById;
exports.listDepartmentMembers = listDepartmentMembers;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const userSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    departmentId: true,
    department: { select: { id: true, name: true, slug: true } },
};
async function login(email, password) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { ...userSelect, passwordHash: true },
    });
    if (!user) {
        return null;
    }
    const valid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!valid) {
        return null;
    }
    const { passwordHash: _, ...safeUser } = user;
    const token = (0, jwt_1.signAccessToken)({
        sub: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
    });
    return { user: safeUser, token };
}
async function register(input) {
    const email = input.email.toLowerCase().trim();
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new Error("EMAIL_IN_USE");
    }
    const department = await prisma_1.prisma.department.findUnique({
        where: { id: input.departmentId },
    });
    if (!department) {
        throw new Error("DEPARTMENT_NOT_FOUND");
    }
    const passwordHash = await bcrypt_1.default.hash(input.password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            passwordHash,
            name: input.name.trim(),
            role: input.role,
            departmentId: input.departmentId,
        },
        select: userSelect,
    });
    const token = (0, jwt_1.signAccessToken)({
        sub: user.id,
        email: user.email,
        role: user.role,
    });
    return { user, token };
}
function toAuthUser(user) {
    return { ...user, role: user.role };
}
async function findUserById(id) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id },
        select: userSelect,
    });
    if (!user)
        return null;
    return toAuthUser(user);
}
async function listDepartmentMembers(actor) {
    if (actor.role !== "DEPARTMENT_MEMBER") {
        throw new Error("FORBIDDEN");
    }
    return prisma_1.prisma.user.findMany({
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

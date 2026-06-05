import { Role } from "@it-ticketing/shared";
import { z } from "zod/v3";

export const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    departmentId: z.string().min(1, "Select your home department"),
    role: z.enum([Role.END_USER, Role.DEPARTMENT_MEMBER], {
      required_error: "Choose whether you are a requester or support agent.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

import { Role, type Role as RoleType } from "@it-ticketing/shared";

export const roleOptions = [
  {
    value: Role.END_USER as RoleType,
    title: "Requester",
    description:
      "Submit IT tickets and track progress on your own requests.",
  },
  {
    value: Role.DEPARTMENT_MEMBER as RoleType,
    title: "Support agent",
    description:
      "Work your department queue — assign, escalate, and resolve tickets.",
  },
] as const;

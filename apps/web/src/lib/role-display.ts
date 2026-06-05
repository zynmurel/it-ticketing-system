import { Role } from "@it-ticketing/shared";

export function getRoleLabel(role: Role) {
  switch (role) {
    case Role.END_USER:
      return "Requester";
    case Role.DEPARTMENT_MEMBER:
      return "Support agent";
    default:
      return role;
  }
}

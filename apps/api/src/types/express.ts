import type { AuthUser } from "@it-ticketing/shared";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};

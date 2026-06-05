import { AuthGuard } from "@/components/auth/auth-guard";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}

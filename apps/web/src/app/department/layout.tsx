import { AuthGuard } from "@/components/auth/auth-guard";

export default function DepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}

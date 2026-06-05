import { AuthGuard } from "@/components/auth/auth-guard";

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}

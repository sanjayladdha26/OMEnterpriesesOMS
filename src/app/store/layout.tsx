import { StoreAppShell } from "@/components/store/store-app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <StoreAppShell>{children}</StoreAppShell>
    </AuthGuard>
  );
}

import { StoreAppShell } from "@/components/store/store-app-shell";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <StoreAppShell>{children}</StoreAppShell>;
}

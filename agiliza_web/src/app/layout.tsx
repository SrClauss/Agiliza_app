import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import RoleGuard from "@/components/RoleGuard";
import NotificationListener from "@/components/NotificationListener";
import DesktopHeader from "@/components/DesktopHeader";
import PermissionsPrompt from "@/components/PermissionsPrompt";

export const metadata: Metadata = {
  title: "Agiliza Pro",
  description: "Plataforma Inteligente de Serviços",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#300267",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <RoleGuard>
          <PermissionsPrompt />
          <NotificationListener />
          <DesktopHeader />
          <div className="app-shell">
            <main className="main-content">
              {children}
            </main>
            <BottomNav />
          </div>
        </RoleGuard>
      </body>
    </html>
  );
}

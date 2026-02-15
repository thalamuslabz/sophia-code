import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata = {
  title: "Sophia Dashboard",
  description: "Governance dashboard for AI-assisted development",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}

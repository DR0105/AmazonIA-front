import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatWidget } from "@/components/chatbot/ChatWidget";

export const metadata: Metadata = {
  title: "AmazonIA – Scientific Monitoring",
  description:
    "Plataforma profesional de monitoreo ambiental e inteligencia artificial para la Amazonía colombiana",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main
            style={{
              marginLeft: 280,
              flex: 1,
              minHeight: "100vh",
              backgroundColor: "#F5F3EC",
            }}
          >
            {children}
          </main>
        </div>
        <ChatWidget />
      </body>
    </html>
  );
}

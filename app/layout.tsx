import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/styles/globals.css";
import { WebSocketProvider } from "@/context/WebSocketContext";

import Navbar from "./navbar";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GuessSBB",
  description: "Guess where the Swiss train is right now.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              // Brand colour – SBB red. Controls focus rings, active borders, etc.
              colorPrimary: "#E30613",
              // Page background (warm off-white, visible behind cards)
              colorBgBase: "#F5F0EB",
              // Surface colour used inside cards, inputs, dropdowns
              colorBgContainer: "#FFFFFF",
              // Default body text
              colorText: "#1A1A1A",
              colorTextSecondary: "#666666",
              // Border default
              colorBorder: "#E0DAD4",
              colorBorderSecondary: "#EDE8E2",
              // Shape
              borderRadius: 12,
              borderRadiusLG: 16,
              borderRadiusSM: 8,
              // Typography – use the Next.js Geist variable
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: 15,
            },
            components: {
              Button: {
                // Primary buttons are SBB red with pill shape
                colorPrimary: "#E30613",
                colorPrimaryHover: "#C0000F",
                colorPrimaryActive: "#A0000C",
                controlHeight: 42,
                borderRadius: 999, // pill
                fontWeight: 600,
                algorithm: true,
              },
              Input: {
                colorBorder: "#D0CAC4",
                colorTextPlaceholder: "#AAAAAA",
                colorBgContainer: "#FFFFFF",
                borderRadius: 10,
                controlHeight: 44,
                algorithm: false,
              },
              Form: {
                labelColor: "#333333",
                algorithm: theme.defaultAlgorithm,
              },
              Card: {
                colorBgContainer: "#FFFFFF",
                borderRadius: 16,
                paddingLG: 28,
              },
              Select: {
                colorBorder: "#D0CAC4",
                borderRadius: 10,
                controlHeight: 44,
              },
              Menu: {
                colorItemBg: "transparent",
                colorItemText: "#333333",
                colorItemTextSelected: "#E30613",
                colorItemTextHover: "#E30613",
                itemBorderRadius: 8,
              },
              Tabs: {
                colorPrimary: "#E30613",
                inkBarColor: "#E30613",
              },
              Tag: {
                borderRadius: 999,
              },
            },
          }}
        >
          <AntdRegistry>
            <AuthProvider>
              <WebSocketProvider>
                <AntdApp>
                  <Navbar />
                  <main className="page-root">
                    {children}
                  </main>
                </AntdApp>
              </WebSocketProvider>
            </AuthProvider>
          </AntdRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
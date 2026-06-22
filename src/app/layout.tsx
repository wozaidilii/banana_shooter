import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC, JetBrains_Mono } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { CyberTombApp } from "~/components/CyberTombApp";
import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "赛博墓碑 · Cyber Tombstone",
  description:
    "赛博墓碑 — 人物复活投票、AI亡灵对话、梗图皮肤共创。牢大、张雪峰等冥界居民等你投票复活。",
  openGraph: {
    title: "赛博墓碑",
    description: "复活赛投票 · AI亡灵对话 · 梗图皮肤共创 — 抽象梗文化的病毒式传播产品",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0618",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable} ${jetbrainsMono.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC, Orbitron, Rajdhani, ZCOOL_QingKe_HuangYou } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { CyberTombApp } from "~/components/CyberTombApp";
import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-orbitron",
});

const zcoolDisplay = ZCOOL_QingKe_HuangYou({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cjk-display",
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
  themeColor: "#03060f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSansSC.variable} ${rajdhani.variable} ${orbitron.variable} ${zcoolDisplay.variable}`}
    >
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}

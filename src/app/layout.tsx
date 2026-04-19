import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Realsoccer — 오늘 볼 경기, 한 번에",
  description:
    "축구를 가장 효율적으로 즐기는 방법. 오늘의 경기 하나, 보는 이유, 관전 포인트.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-bg text-ink selection:bg-accent selection:text-accent-ink">
        {children}
      </body>
    </html>
  );
}

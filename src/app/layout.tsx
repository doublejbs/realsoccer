import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const siteName = "realsoccer";
const siteTitle = "realsoccer — 오늘 볼 경기, 한 번에";
const siteDescription =
  "수많은 경기 중 봐야 할 단 하나와, 왜 봐야 하는지. 축구를 가장 효율적으로 즐기는 개인화 큐레이션.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: "%s · realsoccer",
  },
  description: siteDescription,
  keywords: [
    "축구",
    "해외축구",
    "EPL",
    "프리미어리그",
    "라리가",
    "챔피언스리그",
    "경기 추천",
    "오늘의 경기",
  ],
  authors: [{ name: "realsoccer" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
  // 카카오톡은 표준 OG 태그를 읽지만, 일부 크롤러가 Open Graph 명시적 속성을
  // 선호하므로 og:type / og:locale을 명시적으로 유지.
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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

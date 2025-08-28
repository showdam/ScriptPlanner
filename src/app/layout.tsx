import type { Metadata } from "next";
import { Inter, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
});

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-kr",
});

export const metadata: Metadata = {
  title: "드라마 대본 마법사 | 무료 대본 형식 만들기",
  description: "간단한 텍스트를 표준 한국 드라마 대본 포맷으로 자동 변환. 방송작가들을 위한 무료 대본 변환기. HWP/Word 다운로드 지원.",
  keywords: ["드라마 대본", "스크립트 포맷", "방송작가", "대본 변환기", "HWP", "Word"],
  publisher: "드라마 대본 마법사",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${notoSansKR.variable} ${notoSerifKR.variable} antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}

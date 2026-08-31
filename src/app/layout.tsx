import type { Metadata } from "next";
import Link from "next/link";
import { Shippori_Mincho, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "栄養トラッカー",
  description: "食事記録からPFC・ビタミン・ミネラルを自動計算し、キャラクターがアドバイスする個人用栄養管理アプリ",
};

// ダッシュボードの和紙テーマ(.washi-sheet)で使うフォント。CSS変数として全体に配って参照する。
const shippori = Shippori_Mincho({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-shippori" });
const notoSansJP = Noto_Sans_JP({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-noto" });

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/meals", label: "食事記録" },
  { href: "/history", label: "履歴" },
  { href: "/goals", label: "目標設定" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${shippori.variable} ${notoSansJP.variable}`}>
        <div className="min-h-screen">
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
              <span className="text-base font-bold whitespace-nowrap">栄養トラッカー</span>
              <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {NAV_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href} className="whitespace-nowrap text-gray-600 hover:text-gray-900">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}

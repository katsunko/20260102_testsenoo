import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "栄養トラッカー",
  description: "食事記録からPFC・ビタミン・ミネラルを自動計算し、キャラクターがアドバイスする個人用栄養管理アプリ",
};

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/meals", label: "食事記録" },
  { href: "/history", label: "履歴" },
  { href: "/goals", label: "目標設定" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
              <span className="text-lg font-bold">栄養トラッカー</span>
              <nav className="flex gap-4 text-sm">
                {NAV_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href} className="text-gray-600 hover:text-gray-900">
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

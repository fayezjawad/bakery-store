import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Smart Bakery",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-neutral-100`}>
        {/* Global Background (ALL pages) */}
        <div className="fixed inset-0 -z-10">
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: "url(/home-bg.jpg)",
            }}
          />
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-0 [background:radial-gradient(900px_420px_at_20%_0%,rgba(255,170,90,0.20),transparent_60%),radial-gradient(900px_420px_at_95%_0%,rgba(125,90,255,0.12),transparent_55%)]" />
          <div className="absolute inset-0 [box-shadow:inset_0_0_200px_rgba(0,0,0,0.75)]" />
        </div>

        
        <main>{children}</main>
      </body>
    </html>
  );
}

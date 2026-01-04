import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bakery App",
  description: "Bakery app with products, custom cakes, cart, and tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

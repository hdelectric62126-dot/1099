import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1099 Field Ledger",
  description: "Private receipt, expense, mileage, job and income records for independent electrical work.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

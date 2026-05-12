import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Journaly V2",
  description: "Premium trading journal migration workspace"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

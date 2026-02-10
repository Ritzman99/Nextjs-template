import type { Metadata } from "next";
import { TopNav } from "@/components/ui";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "Next.js template project",
};

const topNavItems = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Components" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TopNav brand="Next.js Template" items={topNavItems} />
        {children}
      </body>
    </html>
  );
}

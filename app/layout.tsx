import type { Metadata } from "next";
import { TopNav } from "@/components/layout";
import { SessionProvider } from "@/components/providers/SessionProvider";
import styles from "./layout.module.scss";
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
        <SessionProvider>
          <TopNav brand="Next.js Template" items={topNavItems} />
          <div className={styles.contentWrap}>{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}

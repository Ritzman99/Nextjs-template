import type { Metadata } from "next";
import { TopNav } from "@/components/layout";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
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

const themeInitScript = `
(function() {
  var key = 'app-theme';
  var valid = ['dark','light','dark2','light2','dark3','light3'];
  try {
    var v = localStorage.getItem(key);
    if (v && valid.indexOf(v) !== -1) document.documentElement.setAttribute('data-theme', v);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>
          <SessionProvider>
            <TopNav brand="Next.js Template" items={topNavItems} />
            <div className={styles.contentWrap}>{children}</div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

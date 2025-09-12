import type { Metadata } from "next";
import "../globals.css";

import I18nProvider from "@/components/i18n-provider";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Health Check",
  description: "Advanced health assessment kiosk application",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={roboto.variable} 
        suppressHydrationWarning={true}
        // Additional attributes to help with browser extensions
        data-suppress-hydration-warning="true"
      >
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}

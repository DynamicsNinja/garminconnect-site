import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "garminconnect-js: Garmin Connect for Claude and for your code", template: "%s · garminconnect-js" },
  description: "Use your Garmin data in Claude with no install, or build with a zero-dependency TypeScript client for Garmin Connect.",
  openGraph: { images: ["/brand/social-preview.png"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-to-content">Skip to content</a>
        <Header />
        <main id="main">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

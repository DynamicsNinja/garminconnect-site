import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://garmin.ficdev.xyz"),
  title: { default: "garminconnect-js — Garmin Connect for Claude and for your code", template: "%s · garminconnect-js" },
  description: "Use your Garmin data in Claude with no install, or build with a zero-dependency TypeScript client for Garmin Connect.",
  openGraph: { images: ["/brand/social-preview.png"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

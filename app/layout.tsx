import type { Metadata } from "next";
import { Cormorant, EB_Garamond, Spline_Sans_Mono } from "next/font/google";
import { ThemeProvider } from "./theme-provider";
import "./globals.css";

// Display: high-contrast Renaissance antiqua, used with restraint.
const display = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Body: Garamond — contemporaneous with Lilly, readable at length.
const body = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

// Utility: monospace for degrees, coordinates, labels — reads as instrument data.
const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Horary — traditional judgment",
  description:
    "Ask one clear question. The chart answers, judged by the traditional rules of William Lilly.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

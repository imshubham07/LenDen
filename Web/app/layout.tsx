import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "LenDen — A little clarity, for every lend.",
  description:
    "Meet LenDen, an open-source personal lending ledger. Keep borrowers, money given, repayments, and outstanding balances in one place. Built by Shubham Kumar Dubey.",
  applicationName: "LenDen",
  authors: [
    { name: "Shubham Kumar Dubey", url: "https://github.com/imshubham07" },
  ],
  openGraph: {
    title: "LenDen — A little clarity, for every lend.",
    description:
      "Less mental maths. More peace of mind. An open-source ledger for everyday lending.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: "LenDen — Your lending, neatly together.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const SITE_URL = "https://nerdy-hackathon.vercel.app";

export const metadata: Metadata = {
  // Lets Next.js resolve the relative icon/OG image paths below into the
  // absolute URLs link-preview crawlers require — without this, sharing the
  // link falls back to no image (or a host default) instead of the app's
  // own icon.
  metadataBase: new URL(SITE_URL),
  title: "LinguaBuild",
  description: "A quest-map language-learning adventure.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "LinguaBuild",
    description: "A quest-map language-learning adventure.",
    url: SITE_URL,
    siteName: "LinguaBuild",
    images: [{ url: "/og-image.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "LinguaBuild",
    description: "A quest-map language-learning adventure.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

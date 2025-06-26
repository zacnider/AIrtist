import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIrtist - AI Sanat Üretici ve NFT Koleksiyonu",
  description: "Stable Diffusion ile güçlendirilmiş AI sanat üretici. Benzersiz NFT koleksiyonları oluşturun ve Monad blockchain'de yayınlayın.",
  keywords: ["AI Art", "NFT", "Stable Diffusion", "Blockchain", "Digital Art", "Monad"],
  authors: [{ name: "AIrtist Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8b5cf6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          <Providers>
            <div className="relative z-10">
              {children}
            </div>
          </Providers>
        </div>
      </body>
    </html>
  );
}

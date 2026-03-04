import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "@/styles/globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TumorVerse - AI Cancer Prediction & Digital Tumor Twin",
  description:
    "Advanced AI-powered cancer type prediction from gene expression data with digital tumor twin simulation, medicine recommendation, and drug response visualization.",
}

export const viewport: Viewport = {
  themeColor: "#0A1628",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.className} antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  )
}

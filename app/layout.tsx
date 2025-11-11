'use client';

import type React from "react"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { WalletContextProvider } from "./contexts/WalletContext"
import "./styles/index.css"
import "./styles/App.css"
import "./styles/main.d0f6361a.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <title>X402 - Solana AI Chatbot</title>
        <meta name="description" content="Platform AI powered by X402 Protocol on Solana. Pay-as-you-go for AI conversations with instant crypto payments." />
      </head>
      <body className={`App font-sans antialiased ${inter.variable}`}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
        <Analytics />
      </body>
    </html>
  )
}

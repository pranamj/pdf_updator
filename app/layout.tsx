// app/layout.js
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI PDF Editor - Edit PDFs with Layout Preservation',
  description: 'Edit PDF documents with AI while preserving original layout, formatting, and design. Powered by Gemini AI.',
  keywords: 'PDF editor, AI, layout preservation, document editing, Gemini AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </div>
      </body>
    </html>
  )
}
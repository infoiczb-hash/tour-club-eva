import './globals.css'

export const metadata = {
  title: 'Tour Club Eva',
  description: 'Туристический клуб',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '언커버링 — 미션으로 발견하는 나의 진로',
  description:
    '설문지 대신 미션을 수행하고, AI가 당신의 진로 성향을 발견합니다. 대학생 대상 진로 탐색 서비스.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#FAFBFF] text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}

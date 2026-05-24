'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  '미션 답변을 읽고 있어요...',
  '단어 패턴을 분석하고 있어요...',
  '사고 방식을 파악하고 있어요...',
  '진로 성향을 정리하고 있어요...',
  '맞춤 결과를 생성하고 있어요...',
]

export default function AnalyzingPage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('uncovering_missions')
    if (!stored) {
      router.replace('/mission')
      return
    }

    let missions: unknown
    try {
      missions = JSON.parse(stored)
    } catch {
      router.replace('/mission')
      return
    }

    let thetas: unknown = null
    try {
      const raw = localStorage.getItem('uncovering_thetas')
      if (raw) thetas = JSON.parse(raw)
    } catch { /* ignore */ }

    // Cycle step text for atmosphere
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length)
    }, 1400)

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missions, thetas }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('분석 요청이 실패했습니다.')
        return res.json()
      })
      .then((data) => {
        clearInterval(interval)
        localStorage.setItem('uncovering_result', JSON.stringify(data))
        router.push('/result')
      })
      .catch((err: Error) => {
        clearInterval(interval)
        setError(err.message || '알 수 없는 오류가 발생했어요.')
      })

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#FAFBFF]">
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-5">😔</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">분석 중 오류가 발생했어요</h2>
          <p className="text-gray-500 text-sm mb-7 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push('/mission')}
            className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            다시 시도하기
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#FAFBFF]">
      <div className="text-center max-w-xs">
        {/* Spinner */}
        <div className="relative w-28 h-28 mx-auto mb-10">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/15" />
          {/* Spinning ring 1 */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary/50"
            style={{ animation: 'spin 2s linear infinite' }}
          />
          {/* Spinning ring 2 */}
          <div
            className="absolute inset-[10px] rounded-full border-[3px] border-transparent border-t-primary"
            style={{ animation: 'spin 1.4s linear infinite reverse' }}
          />
          {/* Inner pulse */}
          <div
            className="absolute inset-[22px] rounded-full bg-primary/10"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🔍
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">
          AI가 당신의 패턴을<br />분석하고 있어요
        </h1>

        <p className="text-primary text-sm font-medium h-5 transition-all duration-500">
          {STEPS[stepIndex]}
        </p>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full bg-primary transition-all duration-300 ${
                i === stepIndex ? 'w-5 opacity-100' : 'w-1.5 opacity-30'
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

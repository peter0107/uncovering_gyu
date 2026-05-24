'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnalysisResult } from '@/lib/types'

type ScoreKey = keyof AnalysisResult['scores']

const DIRECTION_AXES: { key: ScoreKey; label: string; color: string; bg: string }[] = [
  { key: '창의발산', label: '창의·발산', color: 'bg-violet-500', bg: 'bg-violet-50' },
  { key: '사람관계', label: '사람·관계', color: 'bg-pink-500', bg: 'bg-pink-50' },
  { key: '구조분석', label: '구조·분석', color: 'bg-blue-500', bg: 'bg-blue-50' },
  { key: '실행추진', label: '실행·추진', color: 'bg-orange-500', bg: 'bg-orange-50' },
]

const WORKSTYLE_AXES: { key: ScoreKey; label: string; color: string; bg: string }[] = [
  { key: '자율독립', label: '자율·독립', color: 'bg-teal-500', bg: 'bg-teal-50' },
  { key: '협력조율', label: '협력·조율', color: 'bg-cyan-500', bg: 'bg-cyan-50' },
  { key: '빠른실험', label: '빠른실험', color: 'bg-amber-500', bg: 'bg-amber-50' },
  { key: '깊은완성', label: '깊은완성', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
]

function ScoreBar({
  label,
  score,
  color,
  bg,
  animate,
}: {
  label: string
  score: number
  color: string
  bg: string
  animate: boolean
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-800">{score}<span className="text-gray-400 font-normal text-xs"> / 10</span></span>
      </div>
      <div className={`h-3 ${bg} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${color} rounded-full transition-all duration-[1100ms] ease-out`}
          style={{ width: animate ? `${score * 10}%` : '0%' }}
        />
      </div>
    </div>
  )
}

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [animateScores, setAnimateScores] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('uncovering_result')
    if (!stored) {
      router.replace('/')
      return
    }
    try {
      setResult(JSON.parse(stored))
      setTimeout(() => setAnimateScores(true), 300)
    } catch {
      router.replace('/')
    }
  }, [router])

  function handleRestart() {
    localStorage.removeItem('uncovering_missions')
    localStorage.removeItem('uncovering_result')
    router.push('/')
  }

  if (!result) return null

  return (
    <main className="min-h-screen bg-[#FAFBFF] py-10 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Mock mode banner */}
        {result.isMock && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-4 py-3 rounded-2xl">
            <span className="flex-shrink-0 mt-0.5">⚠️</span>
            <span>현재 mock 모드로 실행 중이에요. Claude API 연결 후 실제 분석이 가능해요.</span>
          </div>
        )}

        {/* Hero */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 text-white text-center shadow-xl shadow-primary/20">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5 backdrop-blur-sm">
            ✨ 분석 완료
          </div>
          <p className="text-white/75 text-sm mb-2">당신은</p>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-4 leading-snug">
            {result.type_title}
          </h1>
          <p className="text-white/85 text-sm leading-relaxed">
            {result.type_description}
          </p>
        </div>

        {/* 직무 방향 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base font-bold text-gray-900">직무 방향</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">어떤 일이 맞나요?</span>
          </div>
          <div className="space-y-4">
            {DIRECTION_AXES.map((ax) => (
              <ScoreBar
                key={ax.key}
                label={ax.label}
                score={result.scores[ax.key]}
                color={ax.color}
                bg={ax.bg}
                animate={animateScores}
              />
            ))}
          </div>
        </div>

        {/* 업무 방식 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base font-bold text-gray-900">업무 방식</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">어떻게 일하나요?</span>
          </div>
          <div className="space-y-4">
            {WORKSTYLE_AXES.map((ax) => (
              <ScoreBar
                key={ax.key}
                label={ax.label}
                score={result.scores[ax.key]}
                color={ax.color}
                bg={ax.bg}
                animate={animateScores}
              />
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            미션에서 포착한 인사이트
          </h3>
          <div className="space-y-3">
            {result.insights.map((insight, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended jobs */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">추천 직무</h3>
          <div className="flex flex-wrap gap-2">
            {result.recommended_jobs.map((job) => (
              <span
                key={job}
                className="bg-primary/10 text-primary font-semibold text-sm px-4 py-2 rounded-full hover:bg-primary/15 transition-colors"
              >
                {job}
              </span>
            ))}
          </div>
        </div>

        {/* Restart */}
        <button
          onClick={handleRestart}
          className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-4 rounded-2xl transition-all duration-200 text-base"
        >
          다시 시작하기
        </button>
        <div className="h-4" />
      </div>
    </main>
  )
}

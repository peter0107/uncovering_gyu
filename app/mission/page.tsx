'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MISSIONS, type Mission } from '@/src/data/missions'
import { selectNextMission, updateTheta, initialTheta, getUcbDetail, getIrtDetail, type Theta, type UcbDetail } from '@/src/lib/irt'
import type { MissionData, PartialResult } from '@/lib/types'

const TOTAL_MISSIONS = 6

const REACTION_CONFIG = [
  { key: 'fun', label: '재미있었나요?', left: '별로', right: '완전' },
  { key: 'burden', label: '부담스러웠나요?', left: '편했어요', right: '힘들었어요' },
  { key: 'flow', label: '몰입되었나요?', left: '산만했어요', right: '빠져들었어요' },
  { key: 'retry', label: '다시 하고 싶나요?', left: '아니요', right: '또 하고 싶어요' },
] as const

type ReactionKey = (typeof REACTION_CONFIG)[number]['key']
type Phase = 'answer' | 'reaction' | 'partial-loading' | 'partial-result'

const INITIAL_REACTIONS = { fun: 3, burden: 3, flow: 3, retry: 3 }
const PARTIAL_SCORE_KEYS = ['창의발산', '사람관계', '구조분석', '실행추진'] as const

// reactions(1-5 슬라이더)을 0-10 rawScore로 변환
function reactionsToRawScore(r: typeof INITIAL_REACTIONS): number {
  return ((r.fun - 1) + (5 - r.burden) + (r.flow - 1) + (r.retry - 1)) / 16 * 10
}

const TYPE_PLACEHOLDER: Record<Mission['type'], string> = {
  '텍스트': '여기에 자유롭게 써봐요...',
  '행동': '완료했나요? 무엇을 했는지 간단히 적어봐요.',
  '둘 다': '행동하고 느낀 점을 써봐요.',
}

function TechCaption({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="border-l-2 border-primary/30 bg-primary/[0.04] rounded-r-xl px-3.5 py-2.5">
      <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1.5">{label}</div>
      {lines.map((line, i) => (
        <div key={i} className="text-xs text-gray-500 font-mono leading-relaxed">{line}</div>
      ))}
    </div>
  )
}

export default function MissionPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedAnswers, setCompletedAnswers] = useState<MissionData[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>('answer')
  const [reactions, setReactions] = useState({ ...INITIAL_REACTIONS })
  const [partialResult, setPartialResult] = useState<PartialResult | null>(null)
  const [animatePartialBars, setAnimatePartialBars] = useState(false)

  // IRT state
  const [currentMission, setCurrentMission] = useState<Mission | null>(null)
  const [thetas, setThetas] = useState<Theta>(initialTheta)
  const [axisHistory, setAxisHistory] = useState<Record<string, number[]>>({})
  const [completedIds, setCompletedIds] = useState<number[]>([])

  // 캡션용 알고리즘 상태
  const [ucbDetail, setUcbDetail] = useState<UcbDetail | null>(null)
  const [lastIrtChange, setLastIrtChange] = useState<{ axis: string; oldTheta: number; newTheta: number } | null>(null)
  const [lastUcbReward, setLastUcbReward] = useState<{ axis: string; u: number; count: number } | null>(null)

  // 마운트 시 localStorage에서 IRT 상태 복원 후 첫 미션 선택
  useEffect(() => {
    const savedIds: number[] = (() => {
      try { return JSON.parse(localStorage.getItem('uncovering_completed_ids') ?? '') } catch { return [] }
    })()

    // 완료된 미션이 없으면 새 세션 — 초기값으로 시작
    const isResuming = savedIds.length > 0

    const savedThetas: Theta = isResuming ? (() => {
      try { return JSON.parse(localStorage.getItem('uncovering_thetas') ?? '') } catch { return initialTheta }
    })() : initialTheta

    const savedHistory: Record<string, number[]> = isResuming ? (() => {
      try { return JSON.parse(localStorage.getItem('uncovering_axis_history') ?? '') } catch { return {} }
    })() : {}

    setThetas(savedThetas)
    setAxisHistory(savedHistory)
    setCompletedIds(savedIds)
    setCurrentMission(selectNextMission(savedThetas, savedHistory, savedIds, MISSIONS))
    setUcbDetail(getUcbDetail(savedHistory))
  }, [])

  if (!currentMission) return null
  const mission = currentMission  // null 가드 이후 non-null 타입으로 고정

  const isLastMission = currentIndex === TOTAL_MISSIONS - 1
  const missionDifficulty = mission.scores[mission.mainAxis]

  const rawProgress =
    (currentIndex + (['reaction', 'partial-loading', 'partial-result'].includes(phase) ? 0.5 : 0)) /
    TOTAL_MISSIONS
  const progressPct = Math.round(rawProgress * 100)

  function handleSubmitAnswer() {
    if (!currentAnswer.trim()) return
    setPhase('reaction')
  }

  function handleSubmitReaction() {
    const rawScore = reactionsToRawScore(reactions)
    const u = rawScore / 10

    // mainAxis 능력치만 업데이트 (다른 축은 해당 미션이 측정하지 않음)
    const mainAxis = mission.mainAxis
    const newThetas: Theta = {
      ...thetas,
      [mainAxis]: updateTheta(thetas[mainAxis], mission.scores[mainAxis], rawScore),
    }

    // 캡션용 IRT 업데이트 기록
    const irtCaption = getIrtDetail(thetas[mainAxis], mission.scores[mainAxis], rawScore)
    setLastIrtChange({ axis: mainAxis, oldTheta: irtCaption.oldTheta, newTheta: irtCaption.newTheta })
    setLastUcbReward({ axis: mainAxis, u, count: (axisHistory[mainAxis]?.length ?? 0) + 1 })

    const newHistory = {
      ...axisHistory,
      [mainAxis]: [...(axisHistory[mainAxis] ?? []), u],
    }
    const newCompletedIds = [...completedIds, mission.id]

    // localStorage 저장
    localStorage.setItem('uncovering_thetas', JSON.stringify(newThetas))
    localStorage.setItem('uncovering_axis_history', JSON.stringify(newHistory))
    localStorage.setItem('uncovering_completed_ids', JSON.stringify(newCompletedIds))

    setThetas(newThetas)
    setAxisHistory(newHistory)
    setCompletedIds(newCompletedIds)

    const newAnswer: MissionData = {
      title: mission.title,
      answer: currentAnswer.trim(),
      reactions: { ...reactions },
    }
    const updated = [...completedAnswers, newAnswer]

    if (isLastMission) {
      localStorage.setItem('uncovering_missions', JSON.stringify(updated))
      router.push('/analyzing')
      return
    }

    setCompletedAnswers(updated)
    setPhase('partial-loading')

    fetch('/api/analyze-partial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missions: updated, thetas: newThetas }),
    })
      .then((res) => res.json())
      .then((data: PartialResult) => {
        setPartialResult(data)
        setPhase('partial-result')
        setTimeout(() => setAnimatePartialBars(true), 250)
      })
      .catch(() => {
        const next = selectNextMission(newThetas, newHistory, newCompletedIds, MISSIONS)
        setCurrentMission(next)
        setCurrentIndex(currentIndex + 1)
        setCurrentAnswer('')
        setReactions({ ...INITIAL_REACTIONS })
        setPhase('answer')
      })
  }

  function handleNextMission() {
    const next = selectNextMission(thetas, axisHistory, completedIds, MISSIONS)
    setCurrentMission(next)
    setUcbDetail(getUcbDetail(axisHistory))
    setCurrentIndex(currentIndex + 1)
    setCurrentAnswer('')
    setReactions({ ...INITIAL_REACTIONS })
    setPartialResult(null)
    setAnimatePartialBars(false)
    setPhase('answer')
  }

  return (
    <main className="min-h-screen bg-[#FAFBFF] py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress header */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-primary">
              미션 {currentIndex + 1} / {TOTAL_MISSIONS}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              난이도 {missionDifficulty} / 10
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                  i < missionDifficulty ? 'bg-primary' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── PHASE: answer ── */}
        {phase === 'answer' && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Mission {currentIndex + 1}
                </div>
                {mission.type !== '텍스트' && (
                  <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-full">
                    {mission.type === '행동' ? '🏃 행동 미션' : '🏃✍️ 행동+기록'}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
                {mission.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">{mission.desc}</p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4 focus-within:border-primary/40 transition-colors duration-200">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={TYPE_PLACEHOLDER[mission.type]}
                rows={5}
                className="w-full text-gray-800 placeholder-gray-300 text-sm leading-relaxed resize-none outline-none bg-transparent"
                autoFocus
              />
              <div className="flex justify-end mt-2">
                <span className="text-xs text-gray-300">{currentAnswer.length}자</span>
              </div>
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer.trim()}
              className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-100 disabled:text-gray-300 text-white font-bold py-4 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed text-base"
            >
              제출하기
            </button>

            {ucbDetail && (
              <div className="space-y-2 mt-3">
                <TechCaption
                  label="Contextual Bandit (UCB) — 미션 선택"
                  lines={[
                    ucbDetail.isUnexplored
                      ? `'${ucbDetail.selectedAxis}' 선택 — 아직 탐색하지 않은 축 우선`
                      : `'${ucbDetail.selectedAxis}' 선택 — UCB 점수 최고 (평균보상 ${ucbDetail.avgReward!.toFixed(2)}, 탐색보너스 ${ucbDetail.explorationBonus!.toFixed(2)})`,
                  ]}
                />
                <TechCaption
                  label="IRT (문항반응이론) — 난이도 매칭"
                  lines={[
                    `현재 능력치 θ = ${thetas[mission.mainAxis].toFixed(2)},  미션 난이도 b = ${missionDifficulty}`,
                    `|θ − b| = ${Math.abs(thetas[mission.mainAxis] - missionDifficulty).toFixed(2)} → 이 축에서 차이가 가장 작은 미션 선택됨`,
                  ]}
                />
              </div>
            )}
          </div>
        )}

        {/* ── PHASE: reaction ── */}
        {phase === 'reaction' && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 mb-4">
              <div className="text-center mb-7">
                <div className="text-4xl mb-3 animate-float inline-block">🎯</div>
                <h2 className="text-xl font-bold text-gray-900 mb-1.5">미션 완료!</h2>
                <p className="text-gray-400 text-sm">이 미션을 하면서 어땠나요?</p>
              </div>

              <div className="space-y-6">
                {REACTION_CONFIG.map(({ key, label, left, right }) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">{label}</span>
                      <span className="text-sm font-bold text-primary bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center">
                        {reactions[key as ReactionKey]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={reactions[key as ReactionKey]}
                      onChange={(e) =>
                        setReactions((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                      }
                    />
                    <div className="flex justify-between text-xs text-gray-300 mt-1.5">
                      <span>{left}</span>
                      <span>{right}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(() => {
              const rs = reactionsToRawScore(reactions)
              const d = getIrtDetail(thetas[mission.mainAxis], mission.scores[mission.mainAxis], rs)
              return (
                <TechCaption
                  label="IRT — 능력치 업데이트 미리보기 (실시간)"
                  lines={[
                    `u=${d.u.toFixed(2)}, P(θ,b)=${d.P.toFixed(2)}, α=${d.alpha.toFixed(2)}`,
                    `θ(${mission.mainAxis}): ${d.oldTheta.toFixed(2)} → ${d.newTheta.toFixed(2)}  (${d.newTheta >= d.oldTheta ? '+' : ''}${(d.newTheta - d.oldTheta).toFixed(2)})`,
                  ]}
                />
              )
            })()}

            <button
              onClick={handleSubmitReaction}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 text-base flex items-center justify-center gap-2"
            >
              {isLastMission ? '결과 분석하기' : '중간 결과 확인'}
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10h12M10 4l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}

        {/* ── PHASE: partial-loading ── */}
        {phase === 'partial-loading' && (
          <div className="animate-fadeIn flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
              <div
                className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary"
                style={{ animation: 'spin 1.2s linear infinite' }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🔎</div>
            </div>
            <p className="text-gray-800 font-semibold mb-1">분석 중...</p>
            <p className="text-gray-400 text-sm">지금까지 답변에서 패턴을 찾고 있어요</p>
          </div>
        )}

        {/* ── PHASE: partial-result ── */}
        {phase === 'partial-result' && partialResult && (
          <div className="animate-fadeIn">
            <div className="bg-gradient-to-br from-[#F3F2FD] to-[#EAE9F8] border border-primary/20 rounded-3xl p-6 mb-4">
              <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                🔎 중간 패턴 발견
              </div>

              <p className="text-gray-900 font-bold text-lg mb-2 leading-snug">
                {partialResult.pattern}
              </p>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                {partialResult.signal}
              </p>

              {/* Mini bar chart */}
              <div className="space-y-3">
                {PARTIAL_SCORE_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-14 flex-shrink-0">{key}</span>
                    <div className="flex-1 h-2 bg-white/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: animatePartialBars
                            ? `${partialResult.scores[key] * 10}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-primary w-3 text-right">
                      {partialResult.scores[key]}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-4">
                * 미션이 쌓일수록 분석이 정교해져요
              </p>
            </div>

            {lastIrtChange && lastUcbReward && (
              <div className="mb-4">
                <TechCaption
                  label="미션 완료 — 업데이트"
                  lines={[
                    `u = ${lastUcbReward.u.toFixed(2)}`,
                    `θ(${lastIrtChange.axis}): ${lastIrtChange.oldTheta.toFixed(2)} → ${lastIrtChange.newTheta.toFixed(2)}`,
                  ]}
                />
              </div>
            )}

            <button
              onClick={handleNextMission}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 text-base flex items-center justify-center gap-2"
            >
              미션 {currentIndex + 2} 계속하기
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10h12M10 4l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

import type { Mission, Axis } from '@/src/data/missions'

export type Theta = {
  창의발산: number
  사람관계: number
  구조분석: number
  실행추진: number
}

export const initialTheta: Theta = { 창의발산: 5, 사람관계: 5, 구조분석: 5, 실행추진: 5 }

const AXES: Axis[] = ['창의발산', '사람관계', '구조분석', '실행추진']

// P = 1 / (1 + e^-(θ - b))
function predictP(theta: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-(theta - difficulty)))
}

// θ_new = θ_old + α × (u - P),  α = 0.1 + (difficulty / 10) * 0.4
export function updateTheta(theta: number, difficulty: number, rawScore: number): number {
  const alpha = 0.1 + (difficulty / 10) * 0.4
  const u = rawScore / 10
  const P = predictP(theta, difficulty)
  return theta + alpha * (u - P)
}

// UCB score = avgReward + sqrt(ln(totalTrials) / axisTrials)
// 한 번도 안 한 축은 Infinity로 최우선
export function selectNextMission(
  thetas: Theta,
  axisHistory: Record<string, number[]>,
  completedIds: number[],
  missions: Mission[],
): Mission {
  const totalTrials = Math.max(
    1,
    AXES.reduce((sum, axis) => sum + (axisHistory[axis]?.length ?? 0), 0),
  )

  let bestAxis: Axis = AXES[0]
  let bestScore = -Infinity

  for (const axis of AXES) {
    const history = axisHistory[axis] ?? []
    const score =
      history.length === 0
        ? Infinity
        : history.reduce((a, b) => a + b, 0) / history.length +
          Math.sqrt(Math.log(totalTrials) / history.length)
    if (score > bestScore) {
      bestScore = score
      bestAxis = axis
    }
  }

  const available = missions.filter(
    (m) => m.mainAxis === bestAxis && !completedIds.includes(m.id),
  )

  const pool =
    available.length > 0
      ? available
      : missions.filter((m) => !completedIds.includes(m.id))

  // fallback: pool이 비었으면 전체 미션 중 첫 번째
  if (pool.length === 0) return missions[0]

  const targetAxis = available.length > 0 ? bestAxis : pool[0].mainAxis

  return pool.reduce((best, m) => {
    const diff = Math.abs(m.scores[targetAxis] - thetas[targetAxis])
    const bestDiff = Math.abs(best.scores[targetAxis] - thetas[targetAxis])
    return diff < bestDiff ? m : best
  })
}

// ── 캡션용 디버그 정보 ──────────────────────────────────────

export type UcbDetail = {
  selectedAxis: Axis
  isUnexplored: boolean
  avgReward: number | null
  explorationBonus: number | null
  ucbScore: number | null
}

export function getUcbDetail(axisHistory: Record<string, number[]>): UcbDetail {
  const totalTrials = Math.max(
    1,
    AXES.reduce((sum, axis) => sum + (axisHistory[axis]?.length ?? 0), 0),
  )

  let bestAxis: Axis = AXES[0]
  let bestScore = -Infinity
  const infos = {} as Record<Axis, { score: number; avg: number | null; exploration: number | null; unexplored: boolean }>

  for (const axis of AXES) {
    const history = axisHistory[axis] ?? []
    const unexplored = history.length === 0
    let score: number
    let avg: number | null = null
    let exploration: number | null = null

    if (unexplored) {
      score = Infinity
    } else {
      avg = history.reduce((a, b) => a + b, 0) / history.length
      exploration = Math.sqrt(Math.log(totalTrials) / history.length)
      score = avg + exploration
    }

    infos[axis] = { score, avg, exploration, unexplored }
    if (score > bestScore) {
      bestScore = score
      bestAxis = axis
    }
  }

  const info = infos[bestAxis]
  return {
    selectedAxis: bestAxis,
    isUnexplored: info.unexplored,
    avgReward: info.avg,
    explorationBonus: info.exploration,
    ucbScore: info.unexplored ? null : info.score,
  }
}

export type IrtDetail = {
  oldTheta: number
  difficulty: number
  u: number
  P: number
  alpha: number
  newTheta: number
}

export function getIrtDetail(theta: number, difficulty: number, rawScore: number): IrtDetail {
  const alpha = 0.1 + (difficulty / 10) * 0.4
  const u = rawScore / 10
  const P = predictP(theta, difficulty)
  return { oldTheta: theta, difficulty, u, P, alpha, newTheta: theta + alpha * (u - P) }
}

import { NextRequest, NextResponse } from 'next/server'

interface MissionPayload {
  title: string
  answer: string
  reactions: { fun: number; burden: number; flow: number; retry: number }
}

interface Theta {
  창의발산: number
  사람관계: number
  구조분석: number
  실행추진: number
}

function clamp(n: number) {
  return Math.min(10, Math.max(1, Math.round(n)))
}

function keywordScores(missions: MissionPayload[]) {
  const text = missions.map((m) => m.answer).join(' ')
  const avgLen = missions.length > 0 ? text.length / missions.length : 0

  return {
    구조분석: clamp(5 + (avgLen - 50) / 60),
    사람관계: clamp(5 + ['친구', '사람', '함께'].filter((k) => text.includes(k)).length * 2),
    창의발산: clamp(5 + ['아이디어', '만약', '새로운'].filter((k) => text.includes(k)).length * 2),
    실행추진: clamp(5 + ['했다', '해봤다', '완료'].filter((k) => text.includes(k)).length * 2),
  }
}

export async function POST(req: NextRequest) {
  const { missions, thetas } = (await req.json()) as {
    missions: MissionPayload[]
    thetas?: Theta | null
  }

  if (!missions || !Array.isArray(missions) || missions.length === 0) {
    return NextResponse.json({ error: '미션 데이터가 없습니다.' }, { status: 400 })
  }

  void thetas

  const scores = keywordScores(missions)

  await new Promise((resolve) => setTimeout(resolve, 1200))

  return NextResponse.json({
    pattern: '지금까지 답변을 분석 중이에요 (mock)',
    signal: '키워드 기반 임시 분석 결과예요. Claude API 연결 후 정확해져요.',
    scores,
  })
}

import { NextRequest, NextResponse } from 'next/server'
// import Anthropic from '@anthropic-ai/sdk'  // API 키 준비 시 주석 해제

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

type Scores4 = { 창의발산: number; 사람관계: number; 구조분석: number; 실행추진: number }

function clamp(n: number) {
  return Math.min(10, Math.max(1, Math.round(n)))
}

function keywordScores(missions: MissionPayload[]): Scores4 {
  const text = missions.map((m) => m.answer).join(' ')
  const avgLen = missions.length > 0 ? text.length / missions.length : 0

  return {
    구조분석: clamp(5 + (avgLen - 50) / 60),
    사람관계: clamp(5 + ['친구', '사람', '함께'].filter((k) => text.includes(k)).length * 2),
    창의발산: clamp(5 + ['아이디어', '만약', '새로운'].filter((k) => text.includes(k)).length * 2),
    실행추진: clamp(5 + ['했다', '해봤다', '완료'].filter((k) => text.includes(k)).length * 2),
  }
}

const TYPE_MAP: Record<string, { title: string; desc: string }> = {
  창의발산: {
    title: '아이디어 탐색가',
    desc: '새로운 아이디어를 끊임없이 탐색하고 가능성을 넓히는 타입입니다. 창의적 사고와 상상력이 강점이에요.',
  },
  사람관계: {
    title: '연결하는 조력자',
    desc: '사람과의 연결을 중심에 두고 관계 속에서 에너지를 얻는 타입입니다. 공감 능력과 소통이 강점이에요.',
  },
  구조분석: {
    title: '체계적인 분석가',
    desc: '복잡한 문제를 체계적으로 분해하고 분석하는 타입입니다. 논리적 사고와 꼼꼼함이 강점이에요.',
  },
  실행추진: {
    title: '도전하는 실행가',
    desc: '아이디어를 빠르게 행동으로 옮기고 결과를 만들어내는 타입입니다. 추진력과 도전 정신이 강점이에요.',
  },
}

export async function POST(req: NextRequest) {
  const { missions, thetas } = (await req.json()) as {
    missions: MissionPayload[]
    thetas?: Theta | null
  }

  if (!missions || !Array.isArray(missions) || missions.length === 0) {
    return NextResponse.json({ error: '미션 데이터가 없습니다.' }, { status: 400 })
  }

  // API 키가 있으면 실제 Claude 호출로 교체
  if (process.env.ANTHROPIC_API_KEY) {
    // const client = new Anthropic()
    // const thetaLine = thetas
    //   ? `IRT로 측정된 능력치: ${JSON.stringify(thetas)}\n텍스트 분석 결과와 IRT 능력치를 종합해서 최종 프로파일을 만들어주세요.`
    //   : ''
    // TODO: Claude API 호출 구현
  }
  void thetas

  // Mock 모드: 키워드 기반 분석
  const s4 = keywordScores(missions)
  const topAxis = (Object.entries(s4) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0]
  const { title, desc } = TYPE_MAP[topAxis] ?? TYPE_MAP['창의발산']

  await new Promise((resolve) => setTimeout(resolve, 1500))

  return NextResponse.json({
    isMock: true,
    type_title: title,
    type_description: desc,
    scores: {
      ...s4,
      자율독립: clamp((s4.창의발산 + s4.구조분석) / 2),
      협력조율: s4.사람관계,
      빠른실험: s4.실행추진,
      깊은완성: s4.구조분석,
    },
    insights: [
      '답변 패턴을 분석했어요.',
      'Claude API 연결 후 더 정확한 분석이 가능해요.',
      '지금은 키워드 기반 분석으로 대체 중이에요.',
    ],
    recommended_jobs: ['PM', 'HR', '기획자', '컨설턴트', '마케터'],
  })
}

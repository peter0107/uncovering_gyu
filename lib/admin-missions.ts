export const ADMIN_MISSION_MAP: Record<number, { title: string; scenario: string }> = {
  1: {
    title: '지금 바로 떠오르는 생각을 3줄로 적어보세요',
    scenario: '팀 프로젝트가 시작됐는데 아무도 먼저 말을 꺼내지 않는 상황입니다.',
  },
  2: {
    title: '이 상황에서 가장 먼저 무엇을 하겠습니까?',
    scenario: '마감이 하루 남았는데 예상치 못한 큰 문제가 발견됐습니다.',
  },
  3: {
    title: '어떻게 반응하겠습니까?',
    scenario: '팀원이 내가 보기엔 비효율적인 방식으로 일을 진행하고 있습니다.',
  },
}

export function getMissionMeta(missionOrder: number) {
  return (
    ADMIN_MISSION_MAP[missionOrder] ?? {
      title: `미션 ${missionOrder}`,
      scenario: '정의되지 않은 미션입니다.',
    }
  )
}

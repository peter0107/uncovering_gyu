import { Mission } from './types'

export const MISSIONS: Mission[] = [
  {
    id: 1,
    difficulty: 2,
    title: '지금 떠오르는 단어 5개를 적어보세요',
    description: '맞고 틀리고 없어요. 생각나는 대로요.',
    placeholder: '예: 바다, 커피, 노트북, 고양이, 음악',
  },
  {
    id: 2,
    difficulty: 5,
    title: "'우산'과 '로켓'을 연결하는 이야기를 한 문장으로 만들어보세요",
    description: '말이 안 돼도 괜찮아요. 상상력을 발휘해보세요.',
    placeholder: '예: 우산을 펼치면 로켓처럼 하늘로 솟아오르는 꿈을 꿨다.',
  },
  {
    id: 3,
    difficulty: 7,
    title: '5분 안에 일상용품을 전혀 다른 용도로 쓰는 아이디어 3가지를 써보세요',
    description: '예: 빗을 피아노 건반처럼 연주하기',
    placeholder: '1. \n2. \n3. ',
  },
  {
    id: 4,
    difficulty: 9,
    title: '지금 보이는 사물 하나로 새로운 비즈니스 아이디어를 만들어보세요',
    description: '어디에 팔지, 왜 사람들이 살지도 같이 생각해봐요.',
    placeholder: '사물: \n아이디어: \n고객: \n가치: ',
  },
]

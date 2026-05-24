export interface Mission {
  id: number
  difficulty: number
  title: string
  description: string
  placeholder: string
}

export interface MissionData {
  title: string
  answer: string
  reactions: {
    fun: number
    burden: number
    flow: number
    retry: number
  }
}

export interface PartialResult {
  pattern: string
  signal: string
  scores: {
    창의발산: number
    사람관계: number
    구조분석: number
    실행추진: number
  }
}

export interface AnalysisResult {
  type_title: string
  type_description: string
  isMock?: boolean
  scores: {
    창의발산: number
    사람관계: number
    구조분석: number
    실행추진: number
    자율독립: number
    협력조율: number
    빠른실험: number
    깊은완성: number
  }
  insights: string[]
  recommended_jobs: string[]
}

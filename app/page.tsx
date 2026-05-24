import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-white to-[#F0EEFF]" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-primary/8 blur-2xl translate-y-1/3 -translate-x-1/4" />

      <div className="relative z-10 text-center max-w-2xl mx-auto flex flex-col items-center">
        {/* Logo badge */}
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-10 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-primary font-semibold tracking-wide">대학생 진로 탐색</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-[3.25rem] font-extrabold text-gray-900 mb-5 leading-[1.18] tracking-tight">
          직접 해보면서<br />
          <span className="text-primary">나를 발견하는</span><br />
          진로 탐색
        </h1>

        {/* Subtext */}
        <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 max-w-sm">
          설문지 대신 미션을 수행하세요.<br />
          AI가 당신의 답변 패턴에서 진로 성향을 발견합니다.
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          {[
            { icon: '🎯', text: '4가지 미션' },
            { icon: '🤖', text: 'AI 패턴 분석' },
            { icon: '📊', text: '8개 축 프로파일' },
            { icon: '💼', text: '직무 추천' },
          ].map(({ icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-full shadow-sm font-medium"
            >
              <span>{icon}</span>
              {text}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/mission"
          className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
        >
          지금 시작하기
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <p className="mt-5 text-sm text-gray-400">약 5~10분 소요 · 가입 없이 무료</p>
      </div>
    </main>
  )
}

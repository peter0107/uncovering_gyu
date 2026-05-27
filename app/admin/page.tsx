'use client'

import { useMemo, useState } from 'react'
import { getMissionMeta } from '@/lib/admin-missions'

type AdminResponse = {
  id: string
  user_id: string
  day: number
  mission_order: number
  nickname: string | null
  response_text: string
  fun_rating: number | null
  burden_rating: number | null
  immersion_rating: number | null
  retry_rating: number | null
  feeling_text: string | null
  submitted_at: string
  admin_score: number | null
  admin_comment: string | null
  reviewed_at: string | null
}

type DraftState = Record<string, { adminScore: string; adminComment: string; saving: boolean }>

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value))
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [responses, setResponses] = useState<AdminResponse[]>([])
  const [drafts, setDrafts] = useState<DraftState>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const groupedResponses = useMemo(() => {
    const groups = new Map<string, { label: string; items: AdminResponse[] }>()

    for (const response of responses) {
      const groupKey = `${response.user_id}:${response.day}`
      const nickname = response.nickname?.trim() || '익명 사용자'
      const label = `${nickname} · Day ${response.day}`

      if (!groups.has(groupKey)) {
        groups.set(groupKey, { label, items: [] })
      }

      groups.get(groupKey)?.items.push(response)
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => a.mission_order - b.mission_order),
    }))
  }, [responses])

  function syncDrafts(list: AdminResponse[]) {
    const nextDrafts: DraftState = {}
    for (const item of list) {
      nextDrafts[item.id] = {
        adminScore: item.admin_score?.toString() ?? '',
        adminComment: item.admin_comment ?? '',
        saving: false,
      }
    }
    setDrafts(nextDrafts)
  }

  async function handleLoad() {
    if (!adminKey.trim()) {
      setError('관리자 접근 키를 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/responses', {
        headers: {
          'x-admin-key': adminKey.trim(),
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '응답 목록을 불러오지 못했습니다.')
      }

      const list = (data.responses ?? []) as AdminResponse[]
      setResponses(list)
      syncDrafts(list)
      setLoaded(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function updateDraft(id: string, key: 'adminScore' | 'adminComment', value: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        adminScore: prev[id]?.adminScore ?? '',
        adminComment: prev[id]?.adminComment ?? '',
        saving: prev[id]?.saving ?? false,
        [key]: value,
      },
    }))
  }

  async function handleSave(id: string) {
    const draft = drafts[id]
    if (!draft) return

    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], saving: true },
    }))
    setError(null)

    try {
      const response = await fetch(`/api/admin/responses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({
          adminScore: draft.adminScore ? Number(draft.adminScore) : null,
          adminComment: draft.adminComment,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '저장에 실패했습니다.')
      }

      const updated = data.response as AdminResponse | null
      if (updated) {
        setResponses((prev) => prev.map((item) => (item.id === id ? updated : item)))
        setDrafts((prev) => ({
          ...prev,
          [id]: {
            adminScore: updated.admin_score?.toString() ?? '',
            adminComment: updated.admin_comment ?? '',
            saving: false,
          },
        }))
      } else {
        setDrafts((prev) => ({
          ...prev,
          [id]: { ...prev[id], saving: false },
        }))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(message)
      setDrafts((prev) => ({
        ...prev,
        [id]: { ...prev[id], saving: false },
      }))
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5E6AD2]">
                Admin
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">응답 리뷰 대시보드</h1>
              <p className="mt-2 text-sm text-slate-500">
                Supabase에 저장된 미션 응답을 확인하고 점수와 코멘트를 남길 수 있습니다.
              </p>
            </div>

            <div className="w-full max-w-md space-y-2">
              <label className="block text-sm font-medium text-slate-700">관리자 접근 키</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  placeholder="ADMIN_ACCESS_KEY"
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#5E6AD2] focus:bg-white"
                />
                <button
                  onClick={handleLoad}
                  disabled={loading}
                  className="rounded-2xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? '불러오는 중...' : loaded ? '새로고침' : '불러오기'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        {loaded && groupedResponses.length === 0 && (
          <section className="rounded-[28px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-black/5">
            아직 저장된 응답이 없습니다.
          </section>
        )}

        {groupedResponses.map((group) => (
          <section
            key={group.label}
            className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-slate-900">{group.label}</h2>
              <p className="text-sm text-slate-500">
                응답 {group.items.length}개 · 최신 제출 {formatDateTime(group.items[0].submitted_at)}
              </p>
            </div>

            <div className="space-y-4">
              {group.items.map((item) => {
                const meta = getMissionMeta(item.mission_order)
                const draft = drafts[item.id] ?? {
                  adminScore: '',
                  adminComment: '',
                  saving: false,
                }

                return (
                  <article
                    key={item.id}
                    className="grid gap-5 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]"
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#E7EAFF] px-3 py-1 text-xs font-bold text-[#4654C8]">
                          Mission {item.mission_order}
                        </span>
                        <span className="text-xs text-slate-400">
                          제출 {formatDateTime(item.submitted_at)}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{meta.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{meta.scenario}</p>
                      </div>

                      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                          {item.response_text}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-5">
                        {[
                          ['재미', item.fun_rating],
                          ['부담', item.burden_rating],
                          ['몰입', item.immersion_rating],
                          ['다시할의향', item.retry_rating],
                          ['한줄느낌', item.feeling_text || '-'],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {label}
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-700">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[22px] bg-white p-4 ring-1 ring-slate-200">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          운영자 리뷰
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          점수와 코멘트를 저장하면 이후 사용자 결과 화면에도 재사용할 수 있습니다.
                        </p>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">점수</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={draft.adminScore}
                          onChange={(event) => updateDraft(item.id, 'adminScore', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#5E6AD2] focus:bg-white"
                          placeholder="0-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">코멘트</span>
                        <textarea
                          rows={6}
                          value={draft.adminComment}
                          onChange={(event) => updateDraft(item.id, 'adminComment', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#5E6AD2] focus:bg-white"
                          placeholder="응답을 읽고 남길 피드백을 적어주세요."
                        />
                      </label>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-400">
                          {item.reviewed_at ? `마지막 저장 ${formatDateTime(item.reviewed_at)}` : '아직 저장 안 됨'}
                        </p>
                        <button
                          onClick={() => handleSave(item.id)}
                          disabled={draft.saving}
                          className="rounded-2xl bg-[#5E6AD2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4B57BD] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {draft.saving ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

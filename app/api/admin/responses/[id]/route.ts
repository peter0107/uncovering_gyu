import { NextResponse } from 'next/server'
import { getSupabaseAdminConfig, verifyAdminAccessKey } from '@/lib/admin-supabase'

type UpdatePayload = {
  adminScore?: number | null
  adminComment?: string | null
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!verifyAdminAccessKey(request)) {
      return NextResponse.json({ error: '관리자 접근 키가 올바르지 않습니다.' }, { status: 401 })
    }

    const body = (await request.json()) as UpdatePayload
    const { url, serviceRoleKey } = getSupabaseAdminConfig()

    const response = await fetch(`${url}/rest/v1/responses?id=eq.${params.id}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        admin_score: body.adminScore ?? null,
        admin_comment: body.adminComment?.trim() ? body.adminComment.trim() : null,
        reviewed_at: new Date().toISOString(),
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const detail = await response.text()
      return NextResponse.json({ error: detail || '응답 저장에 실패했습니다.' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ response: data[0] ?? null })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

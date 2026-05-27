import { NextResponse } from 'next/server'
import { getSupabaseAdminConfig, verifyAdminAccessKey } from '@/lib/admin-supabase'

export async function GET(request: Request) {
  try {
    if (!verifyAdminAccessKey(request)) {
      return NextResponse.json({ error: '관리자 접근 키가 올바르지 않습니다.' }, { status: 401 })
    }

    const { url, serviceRoleKey } = getSupabaseAdminConfig()
    const query = new URL(`${url}/rest/v1/responses`)
    query.searchParams.set(
      'select',
      [
        'id',
        'user_id',
        'day',
        'mission_order',
        'nickname',
        'response_text',
        'fun_rating',
        'burden_rating',
        'immersion_rating',
        'retry_rating',
        'feeling_text',
        'submitted_at',
        'admin_score',
        'admin_comment',
        'reviewed_at',
      ].join(',')
    )
    query.searchParams.set('order', 'submitted_at.desc')

    const response = await fetch(query.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const detail = await response.text()
      return NextResponse.json({ error: detail || '응답 목록 조회에 실패했습니다.' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ responses: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

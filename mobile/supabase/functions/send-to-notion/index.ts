import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NOTION_TOKEN = Deno.env.get('NOTION_TOKEN')!;
const NOTION_DB_ID = 'ac39497c62a44af9a0bbcbebc522cfb1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MISSIONS: Record<number, string> = {
  1: '팀 프로젝트가 시작됐는데 아무도 먼저 말을 꺼내지 않는 상황입니다.',
  2: '마감이 하루 남았는데 예상치 못한 큰 문제가 발견됐습니다.',
  3: '팀원이 내가 보기엔 비효율적인 방식으로 일을 진행하고 있습니다.',
};

serve(async (req) => {
  try {
    const { user_id, day } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: userData } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', user_id)
      .single();

    const nickname = userData?.nickname ?? '익명';

    const { data: responses } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', user_id)
      .eq('day', day)
      .order('mission_order');

    if (!responses || responses.length === 0) {
      return new Response(JSON.stringify({ error: 'No responses found' }), { status: 404 });
    }

    const completedAt = new Date().toISOString();

    for (const r of responses) {
      const res = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: NOTION_DB_ID },
          properties: {
            '닉네임':     { title:     [{ text: { content: nickname } }] },
            '일차':       { number:    day },
            '미션 번호':  { number:    r.mission_order },
            '상황':       { rich_text: [{ text: { content: MISSIONS[r.mission_order] ?? '' } }] },
            '답변':       { rich_text: [{ text: { content: r.response_text ?? '' } }] },
            '재미':       { number:    r.fun_rating },
            '부담':       { number:    r.burden_rating },
            '몰입':       { number:    r.immersion_rating },
            '다시할의향': { number:    r.retry_rating },
            '한줄느낌':   { rich_text: [{ text: { content: r.feeling_text ?? '' } }] },
            '완료 시각':  { date:      { start: completedAt } },
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Notion insert 실패:', err);
      }
    }

    return new Response(JSON.stringify({ ok: true, count: responses.length }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

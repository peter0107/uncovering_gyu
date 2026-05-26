import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';

const TEST_DAYS = 3;

// 완료 시각 기준으로 다음날 10:00 KST(= 01:00 UTC) 반환
function getNext10amKST(completedAt: string): Date {
  const next = new Date(completedAt);
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(1, 0, 0, 0); // 01:00 UTC = 10:00 KST
  return next;
}

export default function Index() {
  const { session, user, loading, refreshUser } = useAuth();
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (!user?.day_completed_at) return;
    if (user.current_day >= TEST_DAYS) return;

    const nextMissionAt = getNext10amKST(user.day_completed_at);
    if (new Date() >= nextMissionAt) {
      advanceDay();
    }
  }, [user]);

  async function advanceDay() {
    if (!user) return;
    setAdvancing(true);
    await supabase.from('users').update({
      current_day: user.current_day + 1,
      day_completed_at: null,
    }).eq('id', user.id);
    await refreshUser();
    setAdvancing(false);
  }

  if (loading || advancing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F7FF' }}>
        <ActivityIndicator size="large" color="#7B68EE" />
      </View>
    );
  }

  if (!session || !user) {
    return <Redirect href="/onboarding" />;
  }

  if (user.day_completed_at) {
    // Day 3(테스트 마지막 일차) 완료 → 최종 리포트
    if (user.current_day >= TEST_DAYS) {
      return <Redirect href="/report" />;
    }
    // 아직 대기 중 → 대기 화면
    return <Redirect href="/analyzing" />;
  }

  return <Redirect href="/missions" />;
}

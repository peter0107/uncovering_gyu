import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { getDrafts, clearDrafts, DraftEntry } from '@/lib/missionDraft';

const MOCK_MISSIONS = [
  {
    id: '1',
    order: 1,
    badge: '미션 1',
    scenario: '팀 프로젝트가 시작됐는데 아무도 먼저 말을 꺼내지 않는 상황입니다.',
    prompt: '지금 바로 떠오르는 생각을 3줄로 적어보세요',
    tag: '판단하지 않아도 괜찮아요!',
    emoji: '📝',
  },
  {
    id: '2',
    order: 2,
    badge: '미션 2',
    scenario: '마감이 하루 남았는데 예상치 못한 큰 문제가 발견됐습니다.',
    prompt: '이 상황에서 가장 먼저 무엇을 하겠습니까?',
    tag: '정답은 없어요!',
    emoji: '⏰',
  },
  {
    id: '3',
    order: 3,
    badge: '미션 3',
    scenario: '팀원이 내가 보기엔 비효율적인 방식으로 일을 진행하고 있습니다.',
    prompt: '어떻게 반응하겠습니까?',
    tag: '솔직하게 적어보세요',
    emoji: '🤝',
  },
];

export default function MissionsScreen() {
  const { user, signOut } = useAuth();
  const [drafts, setDrafts] = useState<Record<number, DraftEntry>>({});
  const [submitting, setSubmitting] = useState(false);

  function handleSignOut() {
    Alert.alert('로그아웃', '처음 화면으로 돌아갈까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: async () => { await signOut(); router.replace('/onboarding'); } },
    ]);
  }

  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [])
  );

  async function loadDrafts() {
    const d = await getDrafts();
    setDrafts(d);
  }

  // 미션이 완료된 것으로 간주: 답변 + 감정 평가 모두 있어야 함
  function isDone(order: number): boolean {
    const d = drafts[order];
    return !!d?.answer && d.funRating !== null;
  }

  const allDone = MOCK_MISSIONS.every(m => isDone(m.order));

  async function handleAllComplete() {
    setSubmitting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // 모든 draft를 DB에 한 번에 저장
      const draftList = Object.values(drafts);
      for (const draft of draftList) {
        const { error } = await supabase.from('responses').insert({
          user_id: authUser.id,
          mission_id: null,
          user_mission_id: null,
          day: user?.current_day ?? 1,
          mission_order: draft.missionOrder,
          response_text: draft.answer,
          nickname: user?.nickname ?? null,
          fun_rating: draft.funRating,
          burden_rating: draft.burdenRating,
          immersion_rating: draft.immersionRating,
          retry_rating: draft.retryRating,
          feeling_text: draft.feeling || null,
        });
        if (error) {
          console.error('응답 저장 실패:', error);
          Alert.alert('저장 실패', error.message ?? '다시 시도해주세요.');
          return;
        }
      }

      // day_completed_at 업데이트
      await supabase.from('users').update({
        day_completed_at: new Date().toISOString(),
      }).eq('id', authUser.id);

      // 노션 전송 + 운영자 알림 (실패해도 무시)
      try {
        await supabase.functions.invoke('send-to-notion', {
          body: { user_id: authUser.id, day: user?.current_day ?? 1 },
        });
      } catch {}
      try {
        await supabase.functions.invoke('notify-operator', {
          body: { user_id: authUser.id, day: user?.current_day ?? 1 },
        });
      } catch {}

      await clearDrafts();
    } finally {
      setSubmitting(false);
    }
    router.replace('/analyzing');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{user?.nickname ?? ''}님, 안녕하세요 👋</Text>
            <Text style={styles.title}>오늘의 미션</Text>
          </View>
          <TouchableOpacity style={styles.bell} onLongPress={handleSignOut} activeOpacity={0.7}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* 마감 배너 */}
        <View style={styles.deadline}>
          <Text style={styles.deadlineText}>⏱ 오늘 17:00까지 완료해주세요</Text>
        </View>

        {/* 미션 카드 */}
        {MOCK_MISSIONS.map((mission) => {
          const done = isDone(mission.order);
          return (
            <View key={mission.id} style={[styles.card, done && styles.cardDone]}>
              <View style={styles.cardTop}>
                <View style={[styles.badge, done && styles.badgeDone]}>
                  <Text style={[styles.badgeText, done && styles.badgeTextDone]}>{mission.badge}</Text>
                </View>
                <Text style={styles.cardEmoji}>{done ? '✅' : mission.emoji}</Text>
              </View>

              <Text style={styles.cardTitle}>{mission.prompt}</Text>
              <Text style={styles.cardScenario}>{mission.scenario}</Text>

              <View style={[styles.tag, done && styles.tagDone]}>
                <Text style={[styles.tagText, done && styles.tagTextDone]}>
                  {done ? '완료' : mission.tag}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.timeText}>예상 소요 시간 5분</Text>
                <TouchableOpacity
                  style={[styles.actionBtn, done && styles.actionBtnEdit]}
                  onPress={() => router.push(`/response/${mission.id}`)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionBtnText, done && styles.actionBtnTextEdit]}>
                    {done ? '수정하기' : '실행하기'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* 전부 완료 버튼 */}
        {allDone && (
          <TouchableOpacity
            style={[styles.completeBtn, submitting && styles.completeBtnDisabled]}
            onPress={handleAllComplete}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.completeBtnText}>전부 완료했어요! 🎉</Text>
            }
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: '#8B8CA7',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B68EE',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  deadline: {
    backgroundColor: '#EEE8FD',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  deadlineText: {
    fontSize: 13,
    color: '#7B68EE',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#7B68EE',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardDone: {
    backgroundColor: '#FAFAFA',
    shadowOpacity: 0.03,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#EEE8FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDone: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 12,
    color: '#7B68EE',
    fontWeight: '600',
  },
  badgeTextDone: {
    color: '#4CAF50',
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 24,
    marginBottom: 8,
  },
  cardScenario: {
    fontSize: 13,
    color: '#8B8CA7',
    lineHeight: 20,
    marginBottom: 12,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8EC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  tagDone: {
    backgroundColor: '#E8F5E9',
  },
  tagText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  tagTextDone: {
    color: '#4CAF50',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#B0AECC',
  },
  actionBtn: {
    backgroundColor: '#FF9F1C',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionBtnEdit: {
    backgroundColor: '#F0EEF9',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnTextEdit: {
    color: '#7B68EE',
  },
  completeBtn: {
    backgroundColor: '#7B68EE',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7B68EE',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  completeBtnDisabled: {
    backgroundColor: '#C4BEFF',
    shadowOpacity: 0,
    elevation: 0,
  },
  completeBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

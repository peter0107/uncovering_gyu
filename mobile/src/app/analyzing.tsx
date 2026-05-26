import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';

const TEST_DAYS = 3;

function getNext10amKST(completedAt: string): Date {
  const next = new Date(completedAt);
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(1, 0, 0, 0);
  return next;
}

function formatKST(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul',
  });
}

export default function AnalyzingScreen() {
  const { user } = useAuth();

  const isLastDay = (user?.current_day ?? 1) >= TEST_DAYS;
  const nextMissionAt = user?.day_completed_at
    ? getNext10amKST(user.day_completed_at)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>

        {/* 아이콘 */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>{isLastDay ? '🏁' : '🔍'}</Text>
          </View>
          <View style={[styles.iconCircleSmall, styles.iconCircleLeft]}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
          </View>
          <View style={[styles.iconCircleSmall, styles.iconCircleRight]}>
            <Text style={{ fontSize: 16 }}>💡</Text>
          </View>
        </View>

        <Text style={styles.dayBadge}>Day {user?.current_day ?? 1} 완료</Text>
        <Text style={styles.title}>
          {isLastDay ? '모든 미션을 마쳤어요!' : '오늘 답변을 받았어요'}
        </Text>
        <Text style={styles.desc}>
          {isLastDay
            ? '운영자가 3일치 응답을 분석하고 있어요.\n결과는 곧 전달드릴게요!'
            : '운영자가 오늘 응답을 분석하고 있어요.\n내일 새 미션과 함께 결과를 전달해드려요.'}
        </Text>

        {/* 다음 미션 안내 (마지막 일차가 아닐 때만) */}
        {!isLastDay && nextMissionAt && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>다음 미션 도착</Text>
            <Text style={styles.infoValue}>오전 10:00</Text>
            <Text style={styles.infoDate}>{formatKST(nextMissionAt)}</Text>
            <Text style={styles.infoSub}>앱을 열면 자동으로 미션이 열려요</Text>
          </View>
        )}

        {isLastDay && (
          <View style={[styles.infoCard, styles.infoCardFinal]}>
            <Text style={styles.infoLabel}>분석 완료 후 알림 예정</Text>
            <Text style={styles.infoValue}>최종 리포트</Text>
            <Text style={styles.infoSub}>운영자가 직접 분석 후 전달드려요</Text>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEE8FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
  },
  iconCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#7B68EE',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircleLeft: {
    left: 0,
    top: 20,
  },
  iconCircleRight: {
    right: 0,
    bottom: 10,
  },
  dayBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B68EE',
    backgroundColor: '#EEE8FD',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#8B8CA7',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 4,
    width: '100%',
    shadowColor: '#7B68EE',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    marginTop: 8,
  },
  infoCardFinal: {
    backgroundColor: '#7B68EE',
  },
  infoLabel: {
    fontSize: 12,
    color: '#B0AECC',
  },
  infoValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  infoDate: {
    fontSize: 14,
    color: '#6B6A8A',
    fontWeight: '500',
  },
  infoSub: {
    fontSize: 12,
    color: '#B0AECC',
    marginTop: 4,
  },
});

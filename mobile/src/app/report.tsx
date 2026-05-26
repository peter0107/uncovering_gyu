import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';

const MOCK_REPORT = {
  summary: '오늘 미션에서 몇 가지 흥미로운 성향이 드러났어요.',
  cards: [
    { axis: '착수형', score: 4, description: '망설임 없이 먼저 행동하는 힘이 있어요. 정체된 상황을 깨는 역할을 자연스럽게 합니다.' },
    { axis: '주도형', score: 3, description: '결정이 필요한 순간 앞에 서는 편입니다. 방향을 잡고 이끌어가려는 성향이 나타났어요.' },
    { axis: '분석형', score: 2, description: '상황에 따라 근거를 찾기도, 감각으로 판단하기도 합니다.' },
    { axis: '조율형', score: 1, description: '갈등보다는 협력을 선호하지만, 아직 적극적으로 나서지는 않는 편입니다.' },
  ],
  next_hint: '내일은 관계 영역 미션이 이어집니다.',
};

const SCORE_LABELS = ['거의 없음', '약함', '보통', '강함', '매우 강함'];
const BAR_COLORS = ['#E8E6F5', '#C4BEFF', '#9D8FFF', '#7B68EE', '#5B47D4'];

export default function ReportScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.meta}>{user?.nickname ?? ''}님 · Day 1 리포트</Text>
          <Text style={styles.title}>당신의 적응 방식</Text>
          <Text style={styles.summary}>{MOCK_REPORT.summary}</Text>
        </View>

        {/* 강점 신호 */}
        <Text style={styles.sectionTitle}>강점 신호</Text>

        {MOCK_REPORT.cards.map((card) => (
          <View key={card.axis} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.axisName}>{card.axis}</Text>
              <Text style={[styles.scoreLabel, { color: BAR_COLORS[card.score] }]}>
                {SCORE_LABELS[card.score]}
              </Text>
            </View>

            {/* 강도 바 */}
            <View style={styles.barBg}>
              <View style={[styles.barFill, {
                width: `${(card.score / 4) * 100}%` as any,
                backgroundColor: BAR_COLORS[card.score],
              }]} />
            </View>

            <Text style={styles.description}>{card.description}</Text>
          </View>
        ))}

        {/* 다음 미션 힌트 */}
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>다음 미션 예고</Text>
          <Text style={styles.nextHint}>{MOCK_REPORT.next_hint}</Text>
          <Text style={styles.nextTime}>내일 오전 10:00 발송</Text>
        </View>

        <View style={{ height: 40 }} />
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
    paddingTop: 28,
    paddingBottom: 20,
    gap: 6,
  },
  meta: {
    fontSize: 13,
    color: '#8B8CA7',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  summary: {
    fontSize: 14,
    color: '#8B8CA7',
    lineHeight: 22,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#7B68EE',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  axisName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  barBg: {
    height: 8,
    backgroundColor: '#F0EEF9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B6A8A',
    lineHeight: 20,
  },
  nextCard: {
    backgroundColor: '#7B68EE',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    gap: 6,
  },
  nextLabel: {
    fontSize: 12,
    color: '#C4BEFF',
    fontWeight: '500',
  },
  nextHint: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 22,
  },
  nextTime: {
    fontSize: 12,
    color: '#C4BEFF',
    marginTop: 4,
  },
});

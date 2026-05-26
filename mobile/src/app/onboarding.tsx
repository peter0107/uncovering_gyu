import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useAuth } from '@/context/auth';
import { router } from 'expo-router';

export default function OnboardingScreen() {
  const { signInAnonymously } = useAuth();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!nickname.trim()) {
      Alert.alert('닉네임을 입력해주세요');
      return;
    }
    setLoading(true);
    try {
      await signInAnonymously(nickname.trim());
      router.replace('/missions');
    } catch {
      Alert.alert('오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* 일러스트 영역 */}
        <View style={styles.heroBox}>
          <Text style={styles.emoji}>🗺️</Text>
          <Text style={styles.title}>이건 테스트가{'\n'}아닙니다!</Text>
          <Text style={styles.subtitle}>
            직접 해보는 미션을 통해{'\n'}당신의 적응 방식을{'\n'}발견하는 앱입니다.
          </Text>
        </View>

        {/* 입력 영역 */}
        <View style={styles.inputArea}>
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            placeholder="나만 알 수 있는 닉네임"
            placeholderTextColor="#B0AECC"
            value={nickname}
            onChangeText={setNickname}
            maxLength={12}
            returnKeyType="done"
            onSubmitEditing={handleStart}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>시작하기</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 48,
  },
  heroBox: {
    alignItems: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    color: '#8B8CA7',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputArea: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1.5,
    borderColor: '#E8E6F5',
  },
  button: {
    backgroundColor: '#7B68EE',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: '#C4BEFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

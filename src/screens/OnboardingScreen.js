// src/screens/OnboardingScreen.js
// 온보딩 화면

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { useGoals } from '../context/GoalContext';
import { setOnboardingComplete } from '../utils/storageUtils';
import { COLORS } from '../constants/colors';

const OnboardingScreen = () => {
  const { setShowOnboarding } = useGoals();
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;

  // 페이드 인 애니메이션
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  // 아이콘 플로팅 애니메이션
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloat, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(iconFloat, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  const handleComplete = async () => {
    await setOnboardingComplete();
    setShowOnboarding(false);
  };

  const handleNext = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (onboardingStep) {
      case 0:
        return (
          <>
            <Text style={styles.welcomeTitle}>골포커싱에{'\n'}오신 것을 환영합니다!</Text>
            <Text style={styles.welcomeSubtitle}>
              목표를 설정하고, 집중하고, 달성하세요.
            </Text>
          </>
        );
      case 1:
        return (
          <>
            <Text style={styles.cardTitle}>목표 설정 예시</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>달성목표</Text>
              <View style={styles.inputField}>
                <Text style={styles.inputText}>수학공부 2시간</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>목표 날짜</Text>
              <View style={styles.inputField}>
                <Text style={styles.inputText}>2025-05-24</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>성공 보상</Text>
              <View style={styles.inputField}>
                <Text style={styles.inputText}>1시간 유튜브 시청</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>실패 제약</Text>
              <View style={styles.inputField}>
                <Text style={styles.inputText}>친구한테 10만원 입금</Text>
              </View>
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.cardTitle}>타이머로 집중하기</Text>
            <View style={styles.timerPlaceholder}>
              <Text style={styles.timerTime}>01:45:03</Text>
              <Text style={styles.timerText}>목표는 이루라고 있는 것</Text>
            </View>
            <View style={styles.timeInfo}>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>시작</Text>
                <Text style={styles.timeValue}>11:14</Text>
              </View>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>종료</Text>
                <Text style={styles.timeValue}>13:00</Text>
              </View>
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.cardTitle}>통계로 성장 확인</Text>
            <Text style={styles.statsPercentage}>44%</Text>
            <Text style={styles.statsMessage}>
              꾸준히 노력하면 성장할 수 있어요!
            </Text>
            <View style={styles.statsBarContainer}>
              {[60, 40, 80, 30, 70].map((height, index) => (
                <View key={index} style={styles.barWrapper}>
                  <View style={[styles.bar, { height: `${height}%` }]} />
                  <Text style={styles.barLabel}>{['월', '화', '수', '목', '금'][index]}</Text>
                </View>
              ))}
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* 스텝 인디케이터 */}
        <View style={styles.stepIndicatorContainer}>
          {[0, 1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.stepIndicator,
                onboardingStep === step ? styles.stepIndicatorActive : {}
              ]}
            />
          ))}
        </View>

        {/* 컨텐츠 카드 */}
        <View style={styles.card}>
          {renderStepContent()}
        </View>

        {/* 버튼 */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            {onboardingStep > 0 && (
              <TouchableOpacity style={[styles.button, styles.prevButton]} onPress={handlePrev}>
                <Text style={styles.buttonText}>이전</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.nextButton,
                onboardingStep === 0 ? { flex: 1 } : {}
              ]} 
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>
                {onboardingStep === 3 ? '시작하기' : '다음'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.card,
    marginHorizontal: 4,
  },
  stepIndicatorActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  inputText: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  timerPlaceholder: {
    alignItems: 'center',
    marginVertical: 30,
  },
  timerTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeBox: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statsPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 8,
  },
  statsMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 100,
    alignItems: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  bar: {
    width: '80%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  barLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: COLORS.cardLight,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;

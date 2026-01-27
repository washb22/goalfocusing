// TimerScreen.js - 개선된 UI 버전 (Expo SDK 53 호환)
// SVG 원형 프로그레스 + 보상/제약 표시 + 알림 클릭 시 즉시 모달

import React, { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
  PixelRatio
} from 'react-native';

const isWeb = Platform.OS === 'web';
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const isTablet = windowWidth > 768 || windowHeight > 1024;

// 색상 상수
const PURPLE_COLOR = '#8b5cf6';

// 반응형 크기 계산
const normalize = (size, factor = 0.5) => {
  const scale = isTablet ? windowWidth / 1024 : windowWidth / 375;
  const newSize = size * (isTablet ? 1 : scale);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// 반응형 타이머 크기 계산
const getTimerSize = () => {
  const baseSize = Math.min(windowWidth * 0.75, windowHeight * 0.38);
  const maxSize = isTablet ? 500 : 320;
  return Math.min(baseSize, maxSize);
};

let Svg, Circle, Path, BackgroundTimer, Vibration, Alert, AnimatedCircle;

if (!isWeb) {
  try {
    const RNSvg = require('react-native-svg');
    Svg = RNSvg.Svg;
    Circle = RNSvg.Circle;
    Path = RNSvg.Path;
    AnimatedCircle = Animated.createAnimatedComponent(RNSvg.Circle);
    const importedTimer = require('react-native-background-timer');
    BackgroundTimer = importedTimer.default || importedTimer;
    Vibration = require('react-native').Vibration;
    Alert = require('react-native').Alert;
  } catch (error) {
    console.error('네이티브 모듈 로드 실패:', error);
  }
} else {
  Alert = {
    alert: (title, message, buttons) => {
      const confirmAction = window.confirm(`${title}\n${message}`);
      if (confirmAction && buttons && buttons.length > 0 && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  };
}

const TimerScreen = ({ goal, onBack, onComplete }) => {
  const [remainingTime, setRemainingTime] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const initialTimeRef = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isCompletedRef = useRef(false);
  const hasShownModalRef = useRef(false); // ✅ 모달 표시 여부 추적

  // 디바이스 크기 상태
  const [dimensions, setDimensions] = useState({
    width: windowWidth,
    height: windowHeight
  });
  const [timerSize, setTimerSize] = useState(getTimerSize());

  // 반응형 설정
  const strokeWidth = normalize(16, 0.3);
  const radius = (timerSize - strokeWidth) / 2;
  const bubbleRadius = normalize(18);

  // 디바이스 화면 회전/크기 변경 감지
  useEffect(() => {
    const handleDimensionsChange = ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height
      });
      setTimerSize(getTimerSize());
    };

    const subscription = Dimensions.addEventListener('change', handleDimensionsChange);

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  // 웹 타이머 훅
  const useWebTimer = (callback, interval) => {
    const savedCallback = useRef();
    const intervalId = useRef(null);
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
    const start = () => {
      if (intervalId.current !== null) return;
      intervalId.current = setInterval(() => {
        if (savedCallback.current) savedCallback.current();
      }, interval);
    };
    const stop = () => {
      if (intervalId.current === null) return;
      clearInterval(intervalId.current);
      intervalId.current = null;
    };
    useEffect(() => () => stop(), []);
    return { start, stop };
  };

  const webTimer = useWebTimer(() => {
    setRemainingTime(prev => {
      if (prev <= 1) {
        if (!isCompletedRef.current) {
          animatedValue.setValue(1);
          handleTimerComplete();
          isCompletedRef.current = true;
        }
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  // 남은 시간 계산 (로컬 시간 기준)
  const calculateTimeRemaining = () => {
    if (!goal || !goal.date || !goal.time) return 0;

    try {
      const now = new Date();
      
      // 목표 시간 파싱
      const [h, m] = goal.time.split(':').map(Number);
      
      // ✅ 날짜를 로컬 시간대로 파싱 (UTC 문제 방지)
      const [year, month, day] = goal.date.split('-').map(Number);
      const target = new Date(year, month - 1, day, h, m, 0, 0);

      const diffInSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);
      return diffInSeconds > 0 ? diffInSeconds : 0;
    } catch (error) {
      console.error('시간 계산 오류:', error);
      return 0;
    }
  };

  // 목표 전체 시간 계산
  const calculateTotalDuration = () => {
    if (!goal || !goal.date || !goal.time || !goal.createdAt) {
      return 3600;
    }

    try {
      // 목표 시간 파싱
      const [h, m] = goal.time.split(':').map(Number);
      const [year, month, day] = goal.date.split('-').map(Number);
      const target = new Date(year, month - 1, day, h, m, 0, 0);

      // 시작 시간 파싱
      const [ch, cm] = goal.createdAt.split(':').map(Number);
      const created = new Date(year, month - 1, day, ch, cm, 0, 0);

      const duration = Math.floor((target.getTime() - created.getTime()) / 1000);
      return duration > 0 ? duration : 3600;
    } catch (error) {
      console.error('시간 계산 오류:', error);
      return 3600;
    }
  };

  // ✅ 타이머 완료 처리 (이미 완료/실패면 모달 안 띄움)
  const handleTimerComplete = async () => {
    if (isCompletedRef.current) return;
    
    // ✅ 이미 완료/실패 상태면 모달 안 띄움
    if (goal.status === 'completed' || goal.status === 'failed') {
      console.log('⛔️ 이미 처리된 목표. 모달 생략');
      isCompletedRef.current = true;
      return;
    }

    // 모달 이미 표시했으면 생략
    if (hasShownModalRef.current) {
      console.log('⛔️ 이미 모달 표시됨. 생략');
      return;
    }

    isCompletedRef.current = true;
    hasShownModalRef.current = true;

    console.log('⏰ 완료 처리 시작');
    animatedValue.setValue(1);

    if (isWeb) {
      webTimer.stop();
      if (window.confirm(`'${goal.goal}' 목표 시간에 도달했습니다! 완료하겠습니까?`)) {
        onComplete && onComplete(goal.id, 'completed');
      }
    } else {
      if (BackgroundTimer && timerRef.current) {
        BackgroundTimer.clearInterval(timerRef.current);
      }
      if (Vibration) {
        Vibration.vibrate([500, 200, 500]);
      }

      // Expo SDK 53 호환: trigger: null로 즉시 발송
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `👏 ${goal.goal}, 이제 결과를 선택할 시간이에요.`,
          body: '완료/실패 처리 또는 제약 설정을 진행해주세요.',
          sound: true,
          ...(Platform.OS === 'android' && { channelId: 'goal-timer-channel' }),
        },
        trigger: null,
      });

      Alert.alert('타이머 완료', `'${goal.goal}' 목표 시간에 도달했습니다!`, [
        { text: '완료로 표시', onPress: () => onComplete && onComplete(goal.id, 'completed') },
        { text: '실패로 표시', onPress: () => onComplete && onComplete(goal.id, 'failed') },
        { text: '제약 설정', onPress: () => onComplete && onComplete(goal.id, 'constrained') },
        { text: '닫기', style: 'cancel' }
      ]);
    }
  };

  // 초기화 및 타이머 시작
  useEffect(() => {
    const initial = calculateTotalDuration();
    const remaining = calculateTimeRemaining();
    initialTimeRef.current = initial;
    setRemainingTime(remaining);

    // 페이드 인 애니메이션
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // ✅ 이미 완료/실패 상태면 모달 안 띄움
    if (goal.status === 'completed' || goal.status === 'failed') {
      isCompletedRef.current = true;
      hasShownModalRef.current = true;
      animatedValue.setValue(1);
      return;
    }

    // ✅ 알림에서 왔고 시간이 다 됐으면 즉시 모달 표시
    if (goal.fromNotification && remaining <= 0) {
      console.log('📲 알림에서 옴 + 시간 만료 → 즉시 모달 표시');
      setTimeout(() => {
        handleTimerComplete();
      }, 500);
      return;
    }

    // 타이머 시작
    if (isWeb) {
      webTimer.start();
    } else if (BackgroundTimer) {
      timerRef.current = BackgroundTimer.setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            if (!isCompletedRef.current) {
              animatedValue.setValue(1);
              handleTimerComplete();
              isCompletedRef.current = true;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (isWeb) {
        webTimer.stop();
      } else if (BackgroundTimer && timerRef.current) {
        BackgroundTimer.clearInterval(timerRef.current);
      }
    };
  }, [goal]);

  // 진행률 업데이트
  useEffect(() => {
    if (initialTimeRef.current > 0) {
      if (remainingTime > 0) {
        const newProgress = 1 - remainingTime / initialTimeRef.current;
        const clampedProgress = Math.max(0, Math.min(1, newProgress));
        animatedValue.setValue(clampedProgress);
      } else if (remainingTime === 0) {
        animatedValue.setValue(1);
      }
    }
  }, [remainingTime]);

  const progress = animatedValue;
  
  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // 퍼센트 계산
  const percent = Math.min(
    100,
    Math.max(0, Math.round((1 - remainingTime / Math.max(initialTimeRef.current, 1)) * 100))
  );

  // 시작/종료 시간
  const startTime = goal?.createdAt || '--:--';
  const endTime = goal?.time || '--:--';

  // 타이머 중심 좌표
  const cx = timerSize / 2;
  const cy = timerSize / 2;

  // 퍼센트 버블 위치 계산
  const getPercentPosition = () => {
    const currentProgress = 1 - remainingTime / Math.max(initialTimeRef.current, 1);
    const clampedProgress = Math.max(0, Math.min(1, currentProgress));
    const angle = (-90 + clampedProgress * 360) * (Math.PI / 180);
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  };

  const percentPosition = getPercentPosition();

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => onBack?.()}>
            <Text style={styles.backButtonText}>{'<'} 돌아가기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>달성 목표</Text>

          {/* 목표 이름 표시 */}
          {goal?.goal && (
            <Text style={styles.goalName}>{goal.goal}</Text>
          )}

          {/* SVG 타이머 */}
          {Svg && Circle && AnimatedCircle && (
            <View style={styles.timerWrapper}>
              <View style={styles.timerContainer}>
                <Svg
                  width={timerSize}
                  height={timerSize}
                  style={styles.timerSvg}
                >
                  {/* 배경 원 */}
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    stroke="#333"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />

                  {/* 진행 원 */}
                  <AnimatedCircle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    stroke={PURPLE_COLOR}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={2 * Math.PI * radius}
                    strokeDashoffset={progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [2 * Math.PI * radius, 0],
                      extrapolate: 'clamp'
                    })}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${cx}, ${cy}`}
                  />
                </Svg>

                {/* 퍼센트 버블 */}
                <View
                  style={[
                    styles.percentBubble,
                    {
                      left: percentPosition.x - bubbleRadius,
                      top: percentPosition.y - bubbleRadius,
                      width: bubbleRadius * 2,
                      height: bubbleRadius * 2,
                      borderRadius: bubbleRadius,
                    }
                  ]}
                >
                  <Text style={styles.percentText}>
                    {percent}%
                  </Text>
                </View>

                {/* 중앙 내용 - 시간 + 메시지 + 보상/제약 */}
                <View style={styles.centerTimeContainer}>
                  <Text style={styles.timeDisplay}>
                    {formatTime(remainingTime)}
                  </Text>
                  <Text style={styles.subtitleText}>목표는 이루라고 있는것</Text>
                  {goal?.reward && (
                    <Text style={styles.rewardPenaltyText}>성공보상: {goal.reward}</Text>
                  )}
                  {goal?.penalty && (
                    <Text style={styles.rewardPenaltyText}>실패제약: {goal.penalty}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>시작</Text>
              <Text style={styles.timeValue}>{startTime}</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>목표</Text>
              <Text style={styles.timeValue}>{endTime}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerDescription}>
          제약은 나를 움직이게 하는{'\n'}가장 강력한 무기 입니다.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingTop: normalize(12),
    paddingBottom: normalize(16),
    justifyContent: 'space-between',
  },
  headerContainer: {
    width: '100%',
    paddingHorizontal: normalize(4),
    marginBottom: normalize(12),
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    paddingVertical: normalize(6),
  },
  backButtonText: {
    color: PURPLE_COLOR,
    fontSize: normalize(16)
  },
  title: {
    fontSize: normalize(16),
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: normalize(6),
  },
  goalName: {
    fontSize: normalize(24),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: normalize(26),
    letterSpacing: 0.5,
    lineHeight: normalize(32),
    flexWrap: 'wrap',
    maxWidth: '85%',
    alignSelf: 'center',
    paddingHorizontal: normalize(8),
  },
  timerWrapper: {
    padding: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: normalize(16),
  },
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSvg: {},
  centerTimeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    paddingHorizontal: normalize(20),
  },
  timeDisplay: {
    fontSize: normalize(34),
    fontWeight: 'bold',
    color: PURPLE_COLOR,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginBottom: normalize(4),
  },
  subtitleText: {
    fontSize: normalize(13),
    color: '#bbb',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: normalize(4),
  },
  // ✅ 보상/제약 텍스트 스타일 (이모지 없이, 같은 글씨체)
  rewardPenaltyText: {
    fontSize: normalize(12),
    color: '#999',
    textAlign: 'center',
    marginTop: normalize(2),
  },
  percentBubble: {
    position: 'absolute',
    backgroundColor: PURPLE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  percentText: {
    color: 'white',
    fontSize: normalize(13),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: normalize(20),
    paddingHorizontal: normalize(10),
    marginBottom: normalize(10),
  },
  timeBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: normalize(10),
    padding: normalize(12),
    alignItems: 'center',
    width: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  timeLabel: {
    color: '#aaa',
    fontSize: normalize(12)
  },
  timeValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: normalize(16),
    marginTop: normalize(4)
  },
  footerDescription: {
    fontSize: normalize(13),
    color: '#999',
    textAlign: 'center',
    marginTop: normalize(5),
    marginBottom: normalize(60),
    lineHeight: normalize(18),
    fontWeight: '400',
  }
});

export default TimerScreen;
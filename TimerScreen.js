// TimerScreen.js - 개선된 UI 버전

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
const PURPLE_COLOR = '#8b5cf6'; // 보라색

// 기기 화면 크기에 따른 반응형 크기 계산 함수
const normalize = (size, factor = 0.5) => {
  const scale = isTablet ? windowWidth / 1024 : windowWidth / 375;
  const newSize = size * (isTablet ? 1 : scale);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// 반응형 타이머 크기 계산 - 화면 비율에 맞게 조정
const getTimerSize = () => {
  // 화면 비율에 따라 타이머 크기 조정 - 더 크게 조정
  const baseSize = Math.min(windowWidth * 0.75, windowHeight * 0.38);
  // 최대 크기 제한 증가
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

  // 디바이스 회전 및 크기 변경에 대응하기 위한 상태
  const [dimensions, setDimensions] = useState({
    width: windowWidth,
    height: windowHeight
  });
  const [timerSize, setTimerSize] = useState(getTimerSize());

  // 반응형 설정
  const strokeWidth = normalize(16, 0.3); // 두께 증가
  const radius = (timerSize - strokeWidth) / 2;
  const bubbleRadius = normalize(18); // 버블 크기 증가

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
      } else {
        Dimensions.removeEventListener('change', handleDimensionsChange);
      }
    };
  }, []);

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
        animatedValue.setValue(1);
        handleTimerComplete();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  const calculateTimeRemaining = () => {
    if (!goal || !goal.date || !goal.time) return 0;
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul',
    });
    const parts = formatter.formatToParts(now);
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    if (!hour || !minute) return 0;
    const koreaNow = new Date();
    koreaNow.setHours(parseInt(hour));
    koreaNow.setMinutes(parseInt(minute));
    koreaNow.setSeconds(0);
    const [h, m] = goal.time.split(':').map(Number);
    const target = new Date(goal.date);
    target.setHours(h, m, 0);
    return koreaNow > target ? 0 : Math.floor((target.getTime() - koreaNow.getTime()) / 1000);
  };

  // 목표 전체 시간 계산 함수
  const calculateTotalDuration = () => {
    if (!goal || !goal.date || !goal.time || !goal.createdAt) {
      // 필요한 데이터가 없으면 기본값 반환
      return 3600; // 기본값 1시간
    }

    try {
      const [h, m] = goal.time.split(':').map(Number);
      const target = new Date(goal.date);
      target.setHours(h, m, 0);

      const [ch, cm] = goal.createdAt.split(':').map(Number);
      const created = new Date(goal.date);
      created.setHours(ch, cm, 0);

      const duration = Math.floor((target.getTime() - created.getTime()) / 1000);
      // 음수나 0인 경우 기본값 사용
      return duration > 0 ? duration : 3600;
    } catch (error) {
      console.error('시간 계산 오류:', error);
      return 3600; // 오류 발생 시 기본값
    }
  };

  const handleTimerComplete = async () => {
    animatedValue.setValue(1);
    if (isWeb) {
      webTimer.stop();
      if (window.confirm(`'${goal.goal}' 목표 시간에 도달했습니다! 완료하겠습니까?`)) {
        onComplete && onComplete(goal.id, 'completed');
      }
    } else {
      if (BackgroundTimer && timerRef.current) BackgroundTimer.clearInterval(timerRef.current);
      if (Vibration) Vibration.vibrate([500, 200, 500]);
      await Notifications.scheduleNotificationAsync({
        content: { title: '타이머 완료', body: `'${goal.goal}' 목표 시간에 도달했습니다!`, sound: true },
        trigger: null,
      });
      Alert.alert('타이머 완료', `'${goal.goal}' 목표 시간에 도달했습니다!`, [
        { text: '완료로 표시', onPress: () => onComplete && onComplete(goal.id, 'completed') },
        { text: '제약 적용', onPress: () => onComplete && onComplete(goal.id, 'constrained') },
        { text: '닫기', style: 'cancel' },
      ]);
    }
  };

  useEffect(() => {
    const total = calculateTotalDuration();
    const remaining = calculateTimeRemaining();

    setRemainingTime(remaining);
    initialTimeRef.current = total;

    // 디버그 로깅
    console.log('초기 시간:', total, '남은 시간:', remaining);

    if (remaining > 0) {
      if (isWeb) {
        webTimer.start();
      } else if (BackgroundTimer) {
        timerRef.current = BackgroundTimer.setInterval(() => {
          setRemainingTime(prev => {
            if (prev <= 1) {
              BackgroundTimer.clearInterval(timerRef.current);
              animatedValue.setValue(1);
              setTimeout(() => animatedValue.setValue(1), 50);
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      animatedValue.setValue(1);
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: !isWeb,
    }).start();

    return () => {
      if (isWeb) webTimer.stop();
      else if (BackgroundTimer && timerRef.current) BackgroundTimer.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (initialTimeRef.current > 0 && remainingTime > 0) {
      const newProgress = 1 - remainingTime / initialTimeRef.current;
      // 진행 상태 값 범위 검사 (0~1 사이)
      const clampedProgress = Math.max(0, Math.min(1, newProgress));
      animatedValue.setValue(clampedProgress);

      // 디버그 로깅
      console.log('진행률:', clampedProgress, '남은 시간:', remainingTime, '전체 시간:', initialTimeRef.current);
    }
  }, [remainingTime]);

  const progress = animatedValue;
  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // 퍼센티지 계산 (Infinity 방지)
  const getPercentComplete = () => {
    if (initialTimeRef.current <= 0) return 0;
    const rawPercent = (1 - remainingTime / initialTimeRef.current) * 100;
    // 유효 범위로 제한 (0~100)
    const validPercent = Math.max(0, Math.min(100, rawPercent));
    // 정수로 변환
    return Math.floor(validPercent);
  };

  const percent = getPercentComplete();
  const { hours, minutes } = (() => {
    const h = Math.floor(remainingTime / 3600);
    const m = Math.floor((remainingTime % 3600) / 60);
    return { hours: h, minutes: m };
  })();

  const startTime = goal?.createdAt || '시작시간 없음';
  const endTime = goal?.time || '종료시간 없음';

  const cx = timerSize / 2;
  const cy = timerSize / 2;

  // 퍼센트 위치 계산 (원 둘레를 따라)
  const getPercentPosition = () => {
    // 유효한 각도 계산 (NaN 방지)
    const percentValue = percent / 100;
    const validPercent = isNaN(percentValue) ? 0 : percentValue;

    // 정확한 각도 계산 (-90도에서 시작)
    const angle = 2 * Math.PI * validPercent - Math.PI/2;

    // 위치 계산
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  };

  const percentPosition = getPercentPosition();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => onBack?.()}>
            <Text style={styles.backButtonText}>{'<'} 돌아가기</Text>
          </TouchableOpacity>

        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>달성 목표</Text>

          {/* 목표 이름 표시 (수정된 부분) */}
          {goal?.goal && (
            <Text style={styles.goalName}>{goal.goal}</Text>
          )}

          {/* "꾸준한 목표 달성이 미래의 나를 만듭니다" 문구 제거 */}

          {Svg && Circle && AnimatedCircle && (
            <View style={styles.timerWrapper}>
              <View style={styles.timerContainer}>
                {/* SVG 타이머 - 원과 진행 상태 */}
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

                {/* 퍼센트 버블 (따로 그리기) */}
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

                {/* 중앙 시간 표시 */}
                <View style={styles.centerTimeContainer}>
                  <Text style={styles.timeDisplay}>
                    {formatTime(remainingTime)}
                  </Text>
                  <Text style={styles.subtitleText}>목표는 이루라고 있는 것</Text>
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
              <Text style={styles.timeLabel}>종료</Text>
              <Text style={styles.timeValue}>{endTime}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerDescription}>
          제약은 나를 움직이게 하는{'\n'}가장 강력한 무기 입니다.
        </Text>
      </View>
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
    paddingTop: normalize(12), // 상단 여백 증가
    paddingBottom: normalize(16),
    justifyContent: 'space-between',
  },
  headerContainer: {
    width: '100%',
    paddingHorizontal: normalize(4),
    marginBottom: normalize(12), // 여백 증가
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    flex: 1, // 중앙 콘텐츠가 더 많은 공간 차지
    justifyContent: 'center', // 중앙 정렬 추가
  },
  backButton: {
    paddingVertical: normalize(6),
  },
  backButtonText: {
    color: PURPLE_COLOR,
    fontSize: normalize(16)
  },
  title: {
    fontSize: normalize(16), // 크기 증가
     fontWeight: '500', // 두께 감소
        color: '#94a3b8', // 회색 톤으로 변경
        marginBottom: normalize(6), // 간격 조정
      },

goalName: {
  fontSize: normalize(24), // 24 사이즈 유지
  fontWeight: '700', // 굵게
  color: '#ffffff', // 화이트 색상
  textAlign: 'center',
  marginBottom: normalize(26), // 아래 여백
  letterSpacing: 0.5, // 글자 간격
  lineHeight: normalize(32), // 줄 간격 추가
  flexWrap: 'wrap', // 자동 줄바꿈 확실히
  maxWidth: '85%', // 최대 너비 제한
  alignSelf: 'center', // 중앙 정렬
  paddingHorizontal: normalize(8), // 좌우 패딩 추가
},
  timerWrapper: {
    padding: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: normalize(16), // 여백 증가
  },
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSvg: {
    // 여백 없음
  },
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
    fontSize: normalize(34), // 크기 증가
    fontWeight: 'bold',
    color: PURPLE_COLOR,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginBottom: normalize(4), // 여백 증가
  },
  subtitleText: {
    fontSize: normalize(14), // 크기 증가
    color: '#bbb', // 색상 밝게
    textAlign: 'center',
    fontWeight: '500', // 약간 굵게
  },
  percentBubble: {
    position: 'absolute',
    backgroundColor: PURPLE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    // 그림자 효과 추가
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  percentText: {
    color: 'white',
    fontSize: normalize(13), // 크기 증가
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: normalize(20), // 여백 증가
    paddingHorizontal: normalize(10),
    marginBottom: normalize(10),
  },
  timeBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: normalize(10),
    padding: normalize(12), // 패딩 증가
    alignItems: 'center',
    width: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3, // 그림자 효과 증가
  },
  timeLabel: {
    color: '#aaa',
    fontSize: normalize(12)
  },
  timeValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: normalize(16), // 크기 증가
    marginTop: normalize(4)
  },
  footerDescription: {
    fontSize: normalize(13), // 크기 감소
    color: '#999', // 색상 밝게
    textAlign: 'center',
    marginTop: normalize(5),
    marginBottom: normalize(15),
    lineHeight: normalize(18),
    fontWeight: '400', // 보통 굵기
  }
});

export default TimerScreen;
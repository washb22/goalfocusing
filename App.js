// App.js
// 리팩토링된 메인 앱 파일 - 푸시 알림 클릭 시 타이머로 바로 이동

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Platform,
  BackHandler,
  Alert,
  LogBox,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import * as Notifications from 'expo-notifications';

// Context
import { GoalProvider, useGoals } from './src/context/GoalContext';

// Constants
import { SCREENS } from './src/constants/screens';
import { COLORS } from './src/constants/colors';

// Utils
import { setupNotifications } from './src/utils/notificationUtils';
import { hasSeenOnboarding, loadGoalsFromStorage } from './src/utils/storageUtils';

// Screens
import GoalInputScreen from './src/screens/GoalInputScreen';
import GoalCalendarScreen from './src/screens/GoalCalendarScreen';
import GoalDetailScreen from './src/screens/GoalDetailScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TimerScreen from './TimerScreen';
import StatisticsScreen from './StatisticsScreen';

// Components
import TabBar from './src/components/TabBar';
import DatePickerModal from './src/components/modals/DatePickerModal';
import TimePickerModal from './src/components/modals/TimePickerModal';
import TextInputModal from './src/components/modals/TextInputModal';
import StatusSelectionModal, { ConstraintStatusModal } from './src/components/modals/StatusSelectionModal';
import EditGoalModal from './src/components/modals/EditGoalModal';

// 서비스
let GoalTimerService = null;
if (Platform.OS === 'android') {
  GoalTimerService = require('./GoalTimerService').default;
}

LogBox.ignoreAllLogs(false);
console.log('🟢 App.js 진입됨');

// 메인 앱 내용
const AppContent = () => {
  const {
    currentScreen,
    setCurrentScreen,
    showOnboarding,
    setShowOnboarding,
    savedGoals,
    setSavedGoals,
    selectedGoalForTimer,
    setSelectedGoalForTimer,
    handleTimerComplete,
    goal,
    setGoal,
    goalDate,
    setGoalDate,
    goalTime,
    setGoalTime,
    reward,
    setReward,
    penalty,
    setPenalty,
    updateGoalStatus,
    updateConstraintStatus,
    editGoalData,
    setEditGoalData,
    setEditGoalModal,
  } = useGoals();

  // 모달 상태
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showGoalInputModal, setShowGoalInputModal] = useState(false);
  const [showRewardInputModal, setShowRewardInputModal] = useState(false);
  const [showPenaltyInputModal, setShowPenaltyInputModal] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [showConstraintOptions, setShowConstraintOptions] = useState(false);
  const [currentGoalId, setCurrentGoalId] = useState(null);
  const [currentGoal, setCurrentGoal] = useState(null);

  // 수정용 모달 상태
  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  const [showEditGoalInputModal, setShowEditGoalInputModal] = useState(false);
  const [showEditRewardInputModal, setShowEditRewardInputModal] = useState(false);
  const [showEditPenaltyInputModal, setShowEditPenaltyInputModal] = useState(false);

  // 날짜/시간 선택 상태
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('PM');

  // ✅ 푸시 알림 클릭 시 타이머로 바로 이동하기 위한 ref
  const notificationListener = useRef();
  const responseListener = useRef();

  // 입력 모달 열기
  const openInputModal = (type) => {
    switch (type) {
      case 'goal':
        setShowGoalInputModal(true);
        break;
      case 'reward':
        setShowRewardInputModal(true);
        break;
      case 'penalty':
        setShowPenaltyInputModal(true);
        break;
    }
  };

  // 수정용 날짜 모달 열기
  const openEditDateModal = () => {
    if (editGoalData.date) {
      const [year, month, day] = editGoalData.date.split('-').map(Number);
      setSelectedYear(year);
      setSelectedMonth(month - 1);
      setSelectedDay(day);
    }
    setTimeout(() => setShowEditDateModal(true), 100);
  };

  // 수정용 시간 모달 열기
  const openEditTimeModal = () => {
    if (editGoalData.time) {
      const [hour, minute] = editGoalData.time.split(':').map(Number);
      setSelectedHour(hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour));
      setSelectedMinute(minute);
      setSelectedPeriod(hour >= 12 ? 'PM' : 'AM');
    }
    setTimeout(() => setShowEditTimeModal(true), 100);
  };

  // 날짜 선택 처리
  const handleDateSelect = (dateString) => {
    setGoalDate(dateString);
    setShowDateModal(false);
  };

  // 수정용 날짜 선택 처리
  const handleEditDateSelect = (dateString) => {
    setEditGoalData(prev => ({ ...prev, date: dateString }));
    setShowEditDateModal(false);
    setTimeout(() => setEditGoalModal(true), 100);
  };

  // 시간 선택 처리
  const handleTimeSelect = (timeString) => {
    setGoalTime(timeString);
    setShowTimeModal(false);
  };

  // 수정용 시간 선택 처리
  const handleEditTimeSelect = (timeString) => {
    setEditGoalData(prev => ({ ...prev, time: timeString }));
    setShowEditTimeModal(false);
    setTimeout(() => setEditGoalModal(true), 100);
  };

  // 통계 탭 클릭 처리
  const handleStatisticsTabPress = () => {
    setCurrentScreen(SCREENS.STATISTICS);
  };

  // ✅ 상태 모달 열기 (goal 정보 저장)
  const openStatusModal = (goal) => {
    setCurrentGoalId(goal.id);
    setCurrentGoal(goal);
    setShowStatusOptions(true);
  };

  // ✅ 제약 모달 열기 (goal 정보 저장)
  const openConstraintModal = (goal) => {
    setCurrentGoalId(goal.id);
    setCurrentGoal(goal);
    setShowConstraintOptions(true);
  };

  // 뒤로가기 버튼 처리
  useEffect(() => {
    const backAction = () => {
      if (currentScreen === SCREENS.TIMER) {
        setCurrentScreen(SCREENS.GOAL_DETAIL);
        return true;
      } else if (currentScreen === SCREENS.GOAL_DETAIL) {
        setCurrentScreen(SCREENS.GOAL_CALENDAR);
        return true;
      } else if (currentScreen === SCREENS.GOAL_CALENDAR) {
        setCurrentScreen(SCREENS.GOAL_INPUT);
        return true;
      } else if (currentScreen === SCREENS.GOAL_INPUT) {
        Alert.alert(
          "앱 종료",
          "GoalFocusing 앱을 종료하시겠습니까?",
          [
            { text: "취소", style: "cancel" },
            { text: "종료", onPress: () => BackHandler.exitApp() }
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentScreen]);

  // ✅ 푸시 알림 클릭 시 타이머로 바로 이동
  useEffect(() => {
    // 알림 클릭 응답 리스너
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📲 푸시 알림 클릭됨:', response);
      
      const data = response.notification.request.content.data;
      
      if (data && data.goalId) {
        // 해당 목표 찾기
        const targetGoal = savedGoals.find(g => g.id === data.goalId);
        
        if (targetGoal) {
          console.log('🎯 목표 찾음:', targetGoal.goal);
          
          // 이미 완료/실패한 목표면 타이머만 열고 모달은 안 띄움
          // pending 상태면 타이머로 이동 후 즉시 완료/실패 모달 표시
          setSelectedGoalForTimer({
            ...targetGoal,
            fromNotification: true // 알림에서 온 것 표시
          });
          setCurrentScreen(SCREENS.TIMER);
        } else {
          console.log('⚠️ 목표를 찾을 수 없음. goalId:', data.goalId);
        }
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [savedGoals]);

  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // ⭐ iOS 광고 추적 권한 요청 (반드시 광고 초기화 전에!)
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('iOS 추적 권한 요청 시작...');
          const { status } = await requestTrackingPermissionsAsync();
          console.log('Tracking permission status:', status);
          
          if (status === 'granted') {
            console.log('✅ 추적 허용됨 - 맞춤 광고 제공');
          } else if (status === 'denied') {
            console.log('❌ 추적 거부됨 - 일반 광고 제공');
          } else {
            console.log('⏳ 추적 권한 미결정:', status);
          }
        }

        // 권한 요청 완료 후 광고 초기화
        await mobileAds().initialize();
        console.log('Google Mobile Ads initialized.');

        // 알림 설정
        await setupNotifications();

        // 온보딩 체크
        const hasOnboarded = await hasSeenOnboarding();
        if (!hasOnboarded) {
          setShowOnboarding(true);
        }

        // 목표 데이터 로드
        const goals = await loadGoalsFromStorage();
        if (goals.length > 0) {
          setSavedGoals(goals);
        }
      } catch (error) {
        console.error("앱 초기화 중 오류:", error);
      }
    };

    initializeApp();
  }, []);

  // Android 타이머 서비스
  useEffect(() => {
    if (Platform.OS === 'android' && GoalTimerService) {
      GoalTimerService.start();
      return () => GoalTimerService.stop();
    }
  }, []);

  // 온보딩 표시
  if (showOnboarding) {
    return <OnboardingScreen />;
  }

  // 화면 렌더링
  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.TIMER:
        return selectedGoalForTimer ? (
          <TimerScreen
            goal={selectedGoalForTimer}
            onBack={() => setCurrentScreen(SCREENS.GOAL_DETAIL)}
            onComplete={handleTimerComplete}
          />
        ) : null;
      case SCREENS.GOAL_INPUT:
        return (
          <GoalInputScreen
            openInputModal={openInputModal}
            setShowDateModal={setShowDateModal}
            setShowTimeModal={setShowTimeModal}
          />
        );
      case SCREENS.GOAL_CALENDAR:
        return <GoalCalendarScreen />;
      case SCREENS.GOAL_DETAIL:
        return (
          <GoalDetailScreen
            onOpenStatusModal={openStatusModal}
            onOpenConstraintModal={openConstraintModal}
          />
        );
      case SCREENS.STATISTICS:
        return <StatisticsScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {renderScreen()}

      {/* 탭 바 (타이머 화면에서는 숨김) */}
      {currentScreen !== SCREENS.TIMER && (
        <TabBar
          currentScreen={currentScreen}
          onChangeScreen={setCurrentScreen}
          onStatisticsPress={handleStatisticsTabPress}
        />
      )}

      {/* 모달들 */}
      <DatePickerModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelect={handleDateSelect}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
      />

      <TimePickerModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSelect={handleTimeSelect}
        initialHour={selectedHour}
        initialMinute={selectedMinute}
        initialPeriod={selectedPeriod}
      />

      {/* 목표 입력 모달 */}
      <TextInputModal
        visible={showGoalInputModal}
        onClose={() => setShowGoalInputModal(false)}
        onSave={(text) => {
          setGoal(text);
          setShowGoalInputModal(false);
        }}
        title="목표 입력"
        placeholder="달성하고 싶은 목표를 입력하세요"
        initialValue={goal}
      />

      {/* 보상 입력 모달 */}
      <TextInputModal
        visible={showRewardInputModal}
        onClose={() => setShowRewardInputModal(false)}
        onSave={(text) => {
          setReward(text);
          setShowRewardInputModal(false);
        }}
        title="성공 보상"
        placeholder="목표 달성 시 자신에게 줄 보상을 입력하세요"
        initialValue={reward}
      />

      {/* 제약 입력 모달 */}
      <TextInputModal
        visible={showPenaltyInputModal}
        onClose={() => setShowPenaltyInputModal(false)}
        onSave={(text) => {
          setPenalty(text);
          setShowPenaltyInputModal(false);
        }}
        title="실패 제약"
        placeholder="목표 실패 시 감수할 제약을 입력하세요"
        initialValue={penalty}
      />

      {/* 상태 선택 모달 */}
      <StatusSelectionModal
        visible={showStatusOptions}
        onClose={() => setShowStatusOptions(false)}
        onSelect={updateGoalStatus}
        goalId={currentGoalId}
      />

      {/* 제약 상태 모달 */}
      <ConstraintStatusModal
        visible={showConstraintOptions}
        onClose={() => setShowConstraintOptions(false)}
        onSelect={updateConstraintStatus}
        goalId={currentGoalId}
      />

      {/* 수정용 모달들 */}
      <DatePickerModal
        visible={showEditDateModal}
        onClose={() => {
          setShowEditDateModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        onSelect={handleEditDateSelect}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
      />

      <TimePickerModal
        visible={showEditTimeModal}
        onClose={() => {
          setShowEditTimeModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        onSelect={handleEditTimeSelect}
        initialHour={selectedHour}
        initialMinute={selectedMinute}
        initialPeriod={selectedPeriod}
      />

      <TextInputModal
        visible={showEditGoalInputModal}
        onClose={() => {
          setShowEditGoalInputModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        onSave={(text) => {
          setEditGoalData(prev => ({ ...prev, goal: text }));
          setShowEditGoalInputModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        title="목표 수정"
        placeholder="수정할 목표를 입력하세요"
        initialValue={editGoalData.goal}
      />

      <TextInputModal
        visible={showEditRewardInputModal}
        onClose={() => {
          setShowEditRewardInputModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        onSave={(text) => {
          setEditGoalData(prev => ({ ...prev, reward: text }));
          setShowEditRewardInputModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        title="보상 수정"
        placeholder="수정할 보상을 입력하세요"
        initialValue={editGoalData.reward}
      />

      <TextInputModal
        visible={showEditPenaltyInputModal}
        onClose={() => {
          setShowEditPenaltyInputModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        onSave={(text) => {
          setEditGoalData(prev => ({ ...prev, penalty: text }));
          setShowEditPenaltyInputModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        title="제약 수정"
        placeholder="수정할 제약을 입력하세요"
        initialValue={editGoalData.penalty}
      />

      {/* 목표 수정 모달 */}
      <EditGoalModal
        openEditDateModal={openEditDateModal}
        openEditTimeModal={openEditTimeModal}
        setShowEditGoalInputModal={setShowEditGoalInputModal}
        setShowEditRewardInputModal={setShowEditRewardInputModal}
        setShowEditPenaltyInputModal={setShowEditPenaltyInputModal}
      />
    </SafeAreaView>
  );
};

// 앱 래퍼
export default function App() {
  return (
    <SafeAreaProvider>
      <GoalProvider>
        <AppContent />
      </GoalProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
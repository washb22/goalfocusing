// App.js
// 리팩토링된 메인 앱 파일

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  SafeAreaView,
  Platform,
  BackHandler,
  Alert,
  LogBox,
} from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

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

  // 수정용 모달 상태
  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  const [showEditGoalInputModal, setShowEditGoalInputModal] = useState(false);
  const [showEditRewardInputModal, setShowEditRewardInputModal] = useState(false);
  const [showEditPenaltyInputModal, setShowEditPenaltyInputModal] = useState(false);

  // 날짜/시간 선택 상태
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  // 입력 모달 열기
  const openInputModal = (field) => {
    if (field === 'goal') {
      setShowGoalInputModal(true);
    } else if (field === 'reward') {
      setShowRewardInputModal(true);
    } else if (field === 'penalty') {
      setShowPenaltyInputModal(true);
    }
  };

  // 수정용 입력 모달 열기
  const openEditInputModal = (field) => {
    setEditGoalModal(false);
    setTimeout(() => {
      if (field === 'goal') {
        setShowEditGoalInputModal(true);
      } else if (field === 'reward') {
        setShowEditRewardInputModal(true);
      } else if (field === 'penalty') {
        setShowEditPenaltyInputModal(true);
      }
    }, 100);
  };

  // 수정용 날짜 모달 열기
  const openEditDateModal = () => {
    setEditGoalModal(false);
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
    setEditGoalModal(false);
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

  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // ⭐ iOS 광고 추적 권한 요청 (반드시 광고 초기화 전에!)
        if (Platform.OS === 'ios') {
          console.log('iOS 추적 권한 요청 시작...');
          const { status } = await requestTrackingPermissionsAsync();
          console.log('Tracking permission status:', status);
          
          // 권한 상태에 따른 처리
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
            setShowStatusOptions={setShowStatusOptions}
            setShowConstraintOptions={setShowConstraintOptions}
            setCurrentGoalId={setCurrentGoalId}
          />
        );
      case SCREENS.STATISTICS:
        return <StatisticsScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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

      <TextInputModal
        visible={showGoalInputModal}
        onClose={() => setShowGoalInputModal(false)}
        onSave={setGoal}
        title="달성목표 입력"
        placeholder="목표를 입력하세요"
        initialValue={goal}
      />

      <TextInputModal
        visible={showRewardInputModal}
        onClose={() => setShowRewardInputModal(false)}
        onSave={setReward}
        title="성공 보상 입력"
        placeholder="보상을 입력하세요"
        initialValue={reward}
      />

      <TextInputModal
        visible={showPenaltyInputModal}
        onClose={() => setShowPenaltyInputModal(false)}
        onSave={setPenalty}
        title="실패 제약 입력"
        placeholder="제약을 입력하세요"
        initialValue={penalty}
      />

      {/* 상태 선택 모달 */}
      <StatusSelectionModal
        visible={showStatusOptions}
        onClose={() => setShowStatusOptions(false)}
        onSelect={updateGoalStatus}
        goalId={currentGoalId}
      />

      <ConstraintStatusModal
        visible={showConstraintOptions}
        onClose={() => setShowConstraintOptions(false)}
        onSelect={updateConstraintStatus}
        goalId={currentGoalId}
      />

      {/* 수정 모달 */}
      <EditGoalModal
        onOpenDateModal={openEditDateModal}
        onOpenTimeModal={openEditTimeModal}
        onOpenInputModal={openEditInputModal}
      />

      {/* 수정용 날짜/시간 모달 */}
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

      {/* 수정용 텍스트 입력 모달 */}
      <TextInputModal
        visible={showEditGoalInputModal}
        onClose={() => {
          setShowEditGoalInputModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        onSave={(value) => setEditGoalData(prev => ({ ...prev, goal: value }))}
        title="달성목표 수정"
        placeholder="목표를 입력하세요"
        initialValue={editGoalData.goal}
      />

      <TextInputModal
        visible={showEditRewardInputModal}
        onClose={() => {
          setShowEditRewardInputModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        onSave={(value) => setEditGoalData(prev => ({ ...prev, reward: value }))}
        title="성공 보상 수정"
        placeholder="보상을 입력하세요"
        initialValue={editGoalData.reward}
      />

      <TextInputModal
        visible={showEditPenaltyInputModal}
        onClose={() => {
          setShowEditPenaltyInputModal(false);
          setTimeout(() => setEditGoalModal(true), 100);
        }}
        onSave={(value) => setEditGoalData(prev => ({ ...prev, penalty: value }))}
        title="실패 제약 수정"
        placeholder="제약을 입력하세요"
        initialValue={editGoalData.penalty}
      />
    </SafeAreaView>
  );
};

// 메인 App 컴포넌트
export default function App() {
  return (
    <GoalProvider>
      <AppContent />
    </GoalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
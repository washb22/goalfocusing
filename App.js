console.log('🔥 JS App 시작됨');
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  Keyboard,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { TextInput } from 'react-native-paper';
import TimerScreen from './TimerScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { BackHandler } from 'react-native';
import * as Notifications from 'expo-notifications';
import { LogBox } from 'react-native';
import StatisticsScreen from './StatisticsScreen';
import mobileAds, { InterstitialAd, AdEventType, BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { Alert } from 'react-native';
import { Image } from 'react-native';
import dayjs from 'dayjs';
let GoalTimerService = null;
if (Platform.OS === 'android') {
  GoalTimerService = require('./GoalTimerService').default;
}
LogBox.ignoreAllLogs(false);
console.log('🟢 App.js 진입됨');


// 이미지 경로 설정
const onboardingImages = {
  goalInput: require('./assets/onboarding1.png'),
  timer: require('./assets/onboarding2.png'),
  statistics: require('./assets/onboarding3.png'),
};




// ✅ 포그라운드 푸시 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});




// 목표 상태 상수 정의
const GOAL_STATUS = {
  PENDING: 'pending',       // 미완료
  COMPLETED: 'completed',   // 완료됨
  FAILED: 'failed',         // 실패
};

// 목표 데이터를 저장하는 함수
const saveGoalsToStorage = async (goals) => {
  try {
    const jsonValue = JSON.stringify(goals);
    await AsyncStorage.setItem('savedGoals', jsonValue);
    console.log('목표 데이터 저장 성공:', new Date().toLocaleTimeString());
  } catch (error) {
    console.error('목표 데이터 저장 실패:', error);
  }
};

// 목표 데이터를 불러오는 함수
const loadGoalsFromStorage = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('savedGoals');
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    }
    return []; // 저장된 데이터가 없으면 빈 배열 반환
  } catch (error) {
    console.error('목표 데이터 불러오기 실패:', error);
    return [];
  }
};

// 저장된 데이터와 메모리 데이터 비교 함수 (디버깅용)
const checkStoredGoals = async () => {
  try {
    const storedData = await AsyncStorage.getItem('savedGoals');
    const parsedData = JSON.parse(storedData || '[]');
    console.log('=== 저장 상태 확인 ===');
    console.log('저장된 목표 수:', parsedData.length);
    console.log('저장된 목표 목록:', parsedData.map(g => g.goal).join(', '));
  } catch (e) {
    console.error('데이터 확인 오류:', e);
  }
};

export default function App() {
const goToStatisticsScreen = () => {
  setCurrentScreen(4); // ✅ 정상 작동
};



useEffect(() => {
  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('알림 권한이 거부되었습니다.');
      return;
    }

    // Android에서는 알림 채널 설정이 필요
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('goal-timer-channel', {
        name: '목표 타이머 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6',
        sound: true,
      });
    }

    // 알림 핸들러 설정
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // ✅ 백그라운드에서 앱이 열린 경우와 포그라운드 알림 클릭을 통합 처리
   const handleNotificationResponse = async (response) => {

     // notification 안의 data에서 추출
     const notificationData = response.notification?.request?.content?.data?.notification?.data || {};
     const goalId = notificationData.goalId;
     const isPersistent = notificationData.isPersistent;


     if (goalId) {
       // savedGoals가 이미 로드되어 있는지 확인
       let goals = savedGoals;
       if (goals.length === 0) {
         goals = await loadGoalsFromStorage();
       }

       const targetGoal = goals.find(goal => goal.id === goalId);

       if (targetGoal) {
         setSelectedGoalForTimer(targetGoal);
         setCurrentScreen(3);
       } else {
         setCurrentScreen(1);
       }
     }
   };
        // 백그라운드에서 앱이 열린 경우
        const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastNotificationResponse) {
          handleNotificationResponse(lastNotificationResponse);
        }

        // 포그라운드에서 알림 클릭한 경우
        const notificationListener = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

        return () => {
          if (notificationListener) {
            Notifications.removeNotificationSubscription(notificationListener);
          }
        };
      };

      setupNotifications();
    }, []);


// 3. savedGoals와 pendingNotificationGoalId가 모두 준비되었을 때 네비게이션 처리
useEffect(() => {
  if (pendingNotificationGoalId && savedGoals.length > 0) {
    console.log('알림으로부터 네비게이션 시작:', pendingNotificationGoalId);

    // 목표 찾기
    const targetGoal = savedGoals.find(goal => goal.id === pendingNotificationGoalId);

   if (targetGoal) {
     setSelectedGoalForTimer(targetGoal);
     setTimeout(() => {
       setCurrentScreen(3);
     }, 50); // 약간의 지연 추가 (비동기 상태 반영 보장)
     setPendingNotificationGoalId(null);
   }else {
      console.log('목표를 찾을 수 없습니다:', pendingNotificationGoalId);
      setPendingNotificationGoalId(null);
    }
  }
}, [savedGoals, pendingNotificationGoalId]);

  // 기본 상태 변수
  const [goal, setGoal] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalTime, setGoalTime] = useState('');
  const [reward, setReward] = useState('');
  const [penalty, setPenalty] = useState('');
  const [savedGoals, setSavedGoals] = useState([]);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [selectedGoalForTimer, setSelectedGoalForTimer] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
  const [selectedDateGoals, setSelectedDateGoals] = useState([]);
  const [pendingNotificationGoalId, setPendingNotificationGoalId] = useState(null);
const [showOnboarding, setShowOnboarding] = useState(false);
const [onboardingStep, setOnboardingStep] = useState(1);

  // 임시 입력값 (모달용)
  const [tempGoal, setTempGoal] = useState('');
  const [tempReward, setTempReward] = useState('');
  const [tempPenalty, setTempPenalty] = useState('');
  const [currentInputField, setCurrentInputField] = useState('');

  // 모달 상태
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showGoalInputModal, setShowGoalInputModal] = useState(false);
  const [showRewardInputModal, setShowRewardInputModal] = useState(false);
  const [showPenaltyInputModal, setShowPenaltyInputModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentGoalId, setCurrentGoalId] = useState(null);
  const [showConstraintOptions, setShowConstraintOptions] = useState(false);

  // 목표 수정 관련 상태
  const [editGoalModal, setEditGoalModal] = useState(false);
  const [editGoalId, setEditGoalId] = useState(null);
  const [editGoalData, setEditGoalData] = useState({
    goal: '',
    date: '',
    time: '',
    reward: '',
    penalty: ''
  });

  // 수정 모달용 임시 상태
  const [editTempGoal, setEditTempGoal] = useState('');
  const [editTempReward, setEditTempReward] = useState('');
  const [editTempPenalty, setEditTempPenalty] = useState('');
  const [showEditGoalInputModal, setShowEditGoalInputModal] = useState(false);
  const [showEditRewardInputModal, setShowEditRewardInputModal] = useState(false);
  const [showEditPenaltyInputModal, setShowEditPenaltyInputModal] = useState(false);
  const [currentEditInputField, setCurrentEditInputField] = useState('');

  // 달력 상태
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // 시간 상태
  const [selectedHour, setSelectedHour] = useState(11);
  const [selectedMinute, setSelectedMinute] = useState(58);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  // Refs 및 애니메이션
  const hourScrollViewRef = useRef(null);
  const minuteScrollViewRef = useRef(null);


// 타이머 완료 처리 함수
const handleTimerComplete = async (goalId, newStatus) => {
  console.log('타이머 완료:', goalId, newStatus);

  // 최신 목표 데이터를 AsyncStorage에서 다시 로드
  const latestGoals = await loadGoalsFromStorage();

  // 목표 상태 업데이트
  const updatedGoals = latestGoals.map(goal => {
    if (goal.id === goalId) {
      return { ...goal, status: newStatus };
    }
    return goal;
  });

  // 상태 저장
  setSavedGoals(updatedGoals);
  await saveGoalsToStorage(updatedGoals);

  // 완료된 목표의 날짜를 확실히 설정
  const completedGoal = updatedGoals.find(g => g.id === goalId);
  if (completedGoal && completedGoal.date) {
    setSelectedCalendarDate(completedGoal.date);
    const dateGoals = updatedGoals.filter(g => g.date === completedGoal.date);
    setSelectedDateGoals(dateGoals);

    // 약간의 지연 후 화면 전환 (상태 업데이트 보장)
    setTimeout(() => {
      setCurrentScreen(2);
    }, 100);
  } else {
    // 문제가 있으면 달력 화면으로
    setCurrentScreen(1);
  }
};

// 뒤로가기 버튼 처리를 위한 useEffect
useEffect(() => {
  const backAction = () => {
    // 타이머 화면일 경우
    if (currentScreen === 3) {
      setCurrentScreen(2); // 목표 상세 화면으로 이동
      return true; // 이벤트 소비 (앱 종료 방지)
    }
    // 목표 상세 화면일 경우
    else if (currentScreen === 2) {
      navigateToCalendarView(); // 달력 화면으로 이동
      return true; // 이벤트 소비 (앱 종료 방지)
    }
    // 목표 달력 화면일 경우
    else if (currentScreen === 1) {
      // 첫 화면인 목표 입력으로 이동
      setCurrentScreen(0);
      return true; // 이벤트 소비 (앱 종료 방지)
    }
    // 목표 입력 화면(첫 화면)일 경우
    else if (currentScreen === 0) {
      // 앱 종료 확인 대화상자 표시
      Alert.alert(
        "앱 종료",
        "GoalFocusing 앱을 종료하시겠습니까?",
        [
          {
            text: "취소",
            onPress: () => {},
            style: "cancel"
          },
          {
            text: "종료",
            onPress: () => BackHandler.exitApp()
          }
        ],
        { cancelable: false }
      );
      return true; // 이벤트 소비
    }

    return false; // 기본 동작 허용 (앱 종료)
  };

  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    backAction
  );

  return () => backHandler.remove(); // 컴포넌트 언마운트 시 이벤트 리스너 제거
}, [currentScreen]); // currentScreen 변경 시 이벤트 리스너 업데이트






// 목표 타이머 서비스 시작을 위한 별도의 useEffect
useEffect(() => {
  if (Platform.OS === 'android' && GoalTimerService) {
    GoalTimerService.start();

    return () => {
      GoalTimerService.stop();
    };
  }
}, []);


// 목표가 변경될 때마다 알림 업데이트
useEffect(() => {
  if (savedGoals.length > 0 && Platform.OS === 'android' && GoalTimerService) {
    GoalTimerService.updatePersistentNotification();
  }
}, [savedGoals]);



// 앱 시작시 저장된 목표 데이터 불러오기 useEffect 수정
useEffect(() => {
  const initializeApp = async () => {
    // 첫 실행 여부 체크
    const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    // 기존 목표 로드 로직
    const savedGoalsData = await loadGoalsFromStorage();
    if (savedGoalsData.length > 0) {
      console.log('목표 데이터 로드 성공:', savedGoalsData.length, '개 항목');
      setSavedGoals(savedGoalsData);
    } else {
      console.log('저장된 목표 없음, 샘플 데이터 사용');
      createSampleGoals();
    }
  };

  initializeApp();
}, []);



// ← 여기에 새로운 useEffect 추가
useEffect(() => {
  mobileAds()
    .initialize()
    .then(adapterStatuses => {
      console.log('Google Mobile Ads initialized:', adapterStatuses);
    });
}, []);



//시간 선택기 초기화 (현재 시각 기준)
useEffect(() => {
  if (showTimeModal) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const hour12 = currentHour % 12 === 0 ? 12 : currentHour % 12;
    const ampm = currentHour < 12 ? 'AM' : 'PM';

    setSelectedHour(hour12);
    setSelectedMinute(currentMinute);
    setSelectedPeriod(ampm);

    setTimeout(() => {
      if (hourScrollViewRef.current) {
        hourScrollViewRef.current.scrollTo({
          y: (hour12 - 1) * 40,
          animated: false,
        });
      }
      if (minuteScrollViewRef.current) {
        minuteScrollViewRef.current.scrollTo({
          y: currentMinute * 40,
          animated: false,
        });
      }
    }, 100);
  }
}, [showTimeModal]);

  // 목표 상태 변경 로깅
  useEffect(() => {
    if (savedGoals.length > 0) {
      console.log('현재 저장된 목표 수:', savedGoals.length);
    }
  }, [savedGoals]);

  // 앱 시작시 저장된 목표 데이터 불러오기
  useEffect(() => {
    const loadSavedGoals = async () => {
      const savedGoalsData = await loadGoalsFromStorage();
      if (savedGoalsData.length > 0) {
        console.log('목표 데이터 로드 성공:', savedGoalsData.length, '개 항목');
        setSavedGoals(savedGoalsData);
      } else {
        console.log('저장된 목표 없음, 샘플 데이터 사용');
        createSampleGoals();
      }
    };

    loadSavedGoals();
  }, []);

//통계탭 진입시 하루한번 전면광고
const interstitialAdUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === 'ios'
  ? 'ca-app-pub-3077862428685229/8018462916'
  : 'ca-app-pub-3077862428685229/9380705536'; // 작형님 전면 광고 ID

const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

// 광고 로드 상태
let isAdLoaded = false;

interstitial.addAdEventListener(AdEventType.LOADED, () => {
  console.log('광고 로드 완료');
  isAdLoaded = true;
});

interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  isAdLoaded = false;
});

// 목표화면 배너광고
const bannerAdUnitId = __DEV__
  ? TestIds.BANNER
  : Platform.OS === 'ios'
    ? 'ca-app-pub-3077862428685229/8453269694'  // iOS 배너
    : 'ca-app-pub-3077862428685229/2520091207'; // Android 배너

// 통계 탭 진입 시 미리 로드
const handleStatisticsTabPress = () => {
  // 광고가 필요한 경우에만 미리 로드 시작
  const checkAndLoadAd = async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const lastShown = await AsyncStorage.getItem('lastAdDate');

    if (lastShown !== today && !isAdLoaded) {
      interstitial.load(); // 여기서 미리 로드 시작
    }
  };

  checkAndLoadAd();
  handleStatisticsAccess(); // 기존 함수 호출
};

// 전면광고 + 하루 1회 제한 + 통계탭 진입 함수
const handleStatisticsAccess = async () => {
  const today = dayjs().format('YYYY-MM-DD');
  const lastShown = await AsyncStorage.getItem('lastAdDate');

  if (lastShown === today) {
    goToStatisticsScreen();
    return;
  }

  Alert.alert(
    "광고 안내",
    "이 기능은 하루 한 번 광고 시청 후 사용가능합니다.",
    [
      {
        text: "확인",
        onPress: () => {
          if (isAdLoaded) {
            // 광고가 이미 로드되어 있으면 바로 표시
            interstitial.show();
            AsyncStorage.setItem('lastAdDate', today);
            goToStatisticsScreen();
          } else {
            // 광고가 아직 로드되지 않았으면
            const unsubscribeClose = interstitial.addAdEventListener(
              AdEventType.CLOSED,
              async () => {
                await AsyncStorage.setItem('lastAdDate', today);
                goToStatisticsScreen();
                unsubscribeClose();
              }
            );

            const unsubscribeError = interstitial.addAdEventListener(
              AdEventType.ERROR,
              (err) => {
                console.warn('광고 에러:', err);
                goToStatisticsScreen();
                unsubscribeClose();
                unsubscribeError();
              }
            );

            interstitial.load();

            interstitial.addAdEventListener(AdEventType.LOADED, () => {
              interstitial.show();
            });
          }
        }
      },
      { text: "취소", style: "cancel" }
    ]
  );
};
  // 예시 목표 데이터 생성 (테스트용)
  const createSampleGoals = () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const sampleGoals = [
      {
        id: '1',
        goal: '예시)운동1시간 하기',
        date: todayString,
        time: '15:30',
        reward: '넷플릭스 보기',
        penalty: '공부시간 추가',
        status: GOAL_STATUS.FAILED,
        createdAt: '11:00'
      }
    ];

    setSavedGoals(sampleGoals);
    saveGoalsToStorage(sampleGoals);
  };

  // 목표가 변경될 때마다 데이터 저장하기
  useEffect(() => {
    if (savedGoals.length > 0) {
      saveGoalsToStorage(savedGoals);
    }
  }, [savedGoals]);

  // 모달 상태 추적 (디버깅용)
  useEffect(() => {
    if (editGoalModal) {
      console.log('목표 수정 모달 열림 - ID:', editGoalId);
      console.log('수정 데이터:', editGoalData);
    }
  }, [editGoalModal, editGoalId, editGoalData]);

  useEffect(() => {
    if (showEditGoalInputModal) {
      console.log('목표 텍스트 수정 모달 열림, 값:', editTempGoal);
    }
  }, [showEditGoalInputModal]);

  // 모달 열기 전에 임시 값 설정
  const openInputModal = (field) => {
    setCurrentInputField(field);

    if (field === 'goal') {
      setTempGoal(goal);
      setShowGoalInputModal(true);
    } else if (field === 'reward') {
      setTempReward(reward);
      setShowRewardInputModal(true);
    } else if (field === 'penalty') {
      setTempPenalty(penalty);
      setShowPenaltyInputModal(true);
    }
  };

// 수정 모달 열기 함수 (App.js 파일)
const openEditInputModal = (field) => {
  // 현재 editGoalData 값 복사 저장
  const currentGoalData = {...editGoalData};

  // 필드에 따라 임시 값 설정 (먼저 설정)
  if (field === 'goal') {
    setEditTempGoal(currentGoalData.goal);
  } else if (field === 'reward') {
    setEditTempReward(currentGoalData.reward);
  } else if (field === 'penalty') {
    setEditTempPenalty(currentGoalData.penalty);
  }

  // 현재 수정 중인 필드 설정
  setCurrentEditInputField(field);

  // 메인 수정 모달 숨기기
  setEditGoalModal(false);

  // 약간의 지연 후 해당 필드의 수정 모달 표시
  setTimeout(() => {
    if (field === 'goal') {
      setShowEditGoalInputModal(true);
    } else if (field === 'reward') {
      setShowEditRewardInputModal(true);
    } else if (field === 'penalty') {
      setShowEditPenaltyInputModal(true);
    }
  }, 50); // 지연 시간을 더 짧게 설정
};
  // 모달에서 값 저장
  const saveInputModal = () => {
    if (currentInputField === 'goal') {
      setGoal(tempGoal);
      setShowGoalInputModal(false);
    } else if (currentInputField === 'reward') {
      setReward(tempReward);
      setShowRewardInputModal(false);
    } else if (currentInputField === 'penalty') {
      setPenalty(tempPenalty);
      setShowPenaltyInputModal(false);
    }
  };

  // 수정 모달에서 값 저장
  const saveEditInputModal = () => {
    console.log('수정 텍스트 모달 저장, 필드:', currentEditInputField);

    if (currentEditInputField === 'goal') {
      setEditGoalData(prev => ({...prev, goal: editTempGoal}));
      setShowEditGoalInputModal(false);
    } else if (currentEditInputField === 'reward') {
      setEditGoalData(prev => ({...prev, reward: editTempReward}));
      setShowEditRewardInputModal(false);
    } else if (currentEditInputField === 'penalty') {
      setEditGoalData(prev => ({...prev, penalty: editTempPenalty}));
      setShowEditPenaltyInputModal(false);
    }

    // 모달을 닫은 후 약간의 지연 시간을 두고 메인 수정 모달 다시 표시
    setTimeout(() => {
      setEditGoalModal(true);
    }, 100);
  };

  // 모달 취소
  const cancelInputModal = () => {
    if (currentInputField === 'goal') {
      setShowGoalInputModal(false);
    } else if (currentInputField === 'reward') {
      setShowRewardInputModal(false);
    } else if (currentInputField === 'penalty') {
      setShowPenaltyInputModal(false);
    }
  };

  // 수정 모달 취소
  const cancelEditInputModal = () => {
    console.log('수정 모달 취소, 필드:', currentEditInputField);

    if (currentEditInputField === 'goal') {
      setShowEditGoalInputModal(false);
    } else if (currentEditInputField === 'reward') {
      setShowEditRewardInputModal(false);
    } else if (currentEditInputField === 'penalty') {
      setShowEditPenaltyInputModal(false);
    }

    // 약간의 지연 후 메인 수정 모달 다시 표시
    setTimeout(() => {
      setEditGoalModal(true);
    }, 100);
  };

  // 달력 데이터 생성
  const generateCalendarDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

    const days = [];

    // 이전 달의 날짜들
    const prevMonthDays = new Date(selectedYear, selectedMonth, 0).getDate();
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({
        day: prevMonthDays - firstDayOfMonth + i + 1,
        month: selectedMonth - 1,
        year: selectedYear,
        isCurrentMonth: false
      });
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: selectedMonth,
        year: selectedYear,
        isCurrentMonth: true
      });
    }

    // 다음 달의 날짜들
    const remainingDays = 42 - days.length; // 6주 표시를 위해
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: selectedMonth + 1,
        year: selectedYear,
        isCurrentMonth: false
      });
    }

    return days;
  };

  // 달력 날짜 선택
  const selectDate = (day, month, year) => {
    setSelectedDay(day);
    setSelectedMonth(month);
    setSelectedYear(year);

    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (editGoalId && currentScreen !== 0) { // ✅ 목표 입력화면에서 눌렀을 경우 무시
        setEditGoalData(prev => ({ ...prev, date: dateString }));
        setShowDateModal(false);
        setTimeout(() => {
          setEditGoalModal(true); // ✅ 조건 없이 다시 열어줌
        }, 100);
      } else {
        setGoalDate(dateString);
        setShowDateModal(false);
      }
    };

// 시간 선택 함수 수정
const selectTime = () => {
  let hour = selectedHour;
  if (selectedPeriod === 'PM' && hour < 12) {
    hour += 12;
  } else if (selectedPeriod === 'AM' && hour === 12) {
    hour = 0;
  }

  const timeString = `${String(hour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;

  if (editGoalId && currentScreen !== 0) { // ✅ 목표 입력화면에서 눌렀을 경우 무시
    setEditGoalData(prev => ({ ...prev, time: timeString }));
    setShowTimeModal(false);
    setTimeout(() => {
      setEditGoalModal(true);
    }, 100);
  } else {
    setGoalTime(timeString);
    setShowTimeModal(false);
  }
};
  // 이전/다음 달 이동
  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // 목표 저장 함수
  const saveGoal = async () => {
    // 필수 입력 항목 확인
    if (!goal || !goalDate || !goalTime) {
      alert('목표, 날짜, 시간은 필수 입력 항목입니다.');
      return;
    }

    // 현재 시간을 createdAt으로 저장
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul',
    });

    const parts = formatter.formatToParts(new Date());
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const createdAt = `${hour}:${minute}`;

    // 새 목표 객체 생성
    const newGoal = {
      id: Date.now().toString(), // 고유 ID 생성
      goal,
      date: goalDate,
      time: goalTime,
      reward,
      penalty,
      status: GOAL_STATUS.PENDING, // 기본 상태는 미완료
      createdAt // 목표 생성 시각 저장
    };

    // 기존 목표 배열에 새 목표 추가 (불변성 유지)
    const updatedGoals = [...savedGoals, newGoal];

    // 상태 업데이트
    setSavedGoals(updatedGoals);
    saveGoalsToStorage(updatedGoals);

// ✅ 여기 아래부터 푸시 예약 코드 삽입
try {
  const [hour, minute] = goalTime.split(':').map(Number);
  const targetTime = new Date(goalDate);
  targetTime.setHours(hour, minute, 0);

  // ✅ 현재 시간을 KST 기준으로 보정
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const koreaNow = new Date(utc + 9 * 60 * 60 * 1000);

  const secondsUntil = Math.floor((targetTime.getTime() - koreaNow.getTime()) / 1000);
  console.log('⏱ secondsUntil:', secondsUntil);

if (secondsUntil >= 5) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `👏 ${goal}, 이제 결과를 선택할 시간이에요.`,
      body: '완료 처리 또는 제약 설정을 진행해주세요.',
      sound: true,
 // ✅ 목표 ID를 데이터로 추가
          data: {
            goalId: newGoal.id,
            goalTitle: goal,
            goalDate: goalDate,
            goalTime: goalTime
          }
        },
        trigger: new Date(targetTime.getTime()),
      });
  console.log('✅ 푸시 예약됨 (시각 기반):', targetTime.toLocaleString());
}else {
    console.log('❌ 알림 예약 생략: 너무 가까운 시간이거나 지난 목표');
  }
} catch (error) {
  console.error('❌ 푸시 예약 실패:', error);
}

    // 입력 필드 초기화
    setGoal('');
    setGoalDate('');
    setGoalTime('');
    setReward('');
    setPenalty('');

    // 성공 메시지 표시
    alert('목표가 성공적으로 저장되었습니다!');

    // 저장 확인
    checkStoredGoals();
    setEditGoalId(null); // ✅ 목표 저장 후 수정모드 초기화
  };

  // 목표 업데이트 함수
  const updateGoal = async () => {
    // 필수 입력 확인
    if (!editGoalData.goal || !editGoalData.date || !editGoalData.time) {
      alert('목표, 날짜, 시간은 필수 입력 항목입니다.');
      return;
    }

    console.log('수정 중인 목표 ID:', editGoalId);
    console.log('수정 데이터:', editGoalData);

    try {
      // 목표 업데이트
      const updatedGoals = savedGoals.map(goal => {
        if (goal.id === editGoalId) {
          // 수정 전후 데이터 로깅 (디버깅용)
          console.log('수정 전:', goal);
          console.log('수정 후:', {...goal, ...editGoalData});

          return {
            ...goal, // 기존 데이터 유지
            goal: editGoalData.goal,
            date: editGoalData.date,
            time: editGoalData.time,
            reward: editGoalData.reward || '',
            penalty: editGoalData.penalty || ''
          };
        }
        return goal;
      });

      // 전체 업데이트된 목표 로깅
      console.log('업데이트된 목표 배열:', updatedGoals);

      // 모달 닫기 (상태 업데이트 전에 먼저 닫기)
      setEditGoalModal(false);

      // 목표 배열 상태 업데이트
      setSavedGoals(updatedGoals);

      // 선택된 날짜의 목표도 업데이트
      if (selectedCalendarDate) {
        const updatedDateGoals = updatedGoals.filter(g => g.date === selectedCalendarDate);
        setSelectedDateGoals(updatedDateGoals);
      }

      // 비동기 저장
      await saveGoalsToStorage(updatedGoals);

      // 성공 메시지
      alert('목표가 성공적으로 수정되었습니다!');

      // 저장 확인 (디버깅용)
      setTimeout(checkStoredGoals, 500);
    } catch (error) {
      console.error('목표 업데이트 오류:', error);
      alert('목표 수정 중 오류가 발생했습니다.');
    }
  };

  // 달력에서 날짜 선택
  const selectCalendarDate = (day, month, year) => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedCalendarDate(dateString);

    // 선택된 날짜의 목표만 필터링
    const filteredGoals = savedGoals.filter(g => g.date === dateString);
    setSelectedDateGoals(filteredGoals);

    // 상세 뷰로 전환
    setCurrentScreen(2);
  };

  // 달력 뷰로 돌아가기
  const navigateToCalendarView = () => {
    setCurrentScreen(1);
  };

  // 월 이름 배열
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // 시간 배열 생성 - 1부터 12시까지
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  // 분 배열 생성 - 00부터 55분까지 5분 간격
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // 시간 선택 함수 - 스크롤 정렬과 함께
  const handleSelectHour = (hour) => {
    setSelectedHour(parseInt(hour));
    if (hourScrollViewRef.current) {
      hourScrollViewRef.current.scrollTo({
        y: (parseInt(hour) - 1) * 40,
        animated: true
      });
    }
  };

  // 분 선택 함수 - 스크롤 정렬과 함께
  const handleSelectMinute = (minute) => {
    setSelectedMinute(parseInt(minute));
    if (minuteScrollViewRef.current) {
      minuteScrollViewRef.current.scrollTo({
        y: parseInt(minute) * 40,
        animated: true
      });
    }
  };

  // 특정 날짜에 목표가 있는지 확인하는 함수
  const hasGoalsOnDate = (day, month, year) => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return savedGoals.some(g => g.date === dateString);
  };

  // 목표 상태 변경 함수
  const updateGoalStatus = (goalId, newStatus) => {
    const updatedGoals = savedGoals.map(goal => {
      if (goal.id === goalId) {
        return { ...goal, status: newStatus };
      }
      return goal;
    });

    setSavedGoals(updatedGoals);
    saveGoalsToStorage(updatedGoals);

    // 선택된 날짜의 목표 업데이트
    if (selectedCalendarDate) {
      const updatedDateGoals = updatedGoals.filter(g => g.date === selectedCalendarDate);
      setSelectedDateGoals(updatedDateGoals);
    }
  };

// 제약 상태 업데이트 함수
const updateConstraintStatus = (goalId, status) => {
  const updatedGoals = savedGoals.map(goal => {
    if (goal.id === goalId) {
      return { ...goal, constraintStatus: status };
    }
    return goal;
  });

  setSavedGoals(updatedGoals);
  saveGoalsToStorage(updatedGoals);

  if (selectedCalendarDate) {
    setSelectedDateGoals(updatedGoals.filter(g => g.date === selectedCalendarDate));
  }
};



  // 목표 삭제 함수
  const deleteGoal = (goalId) => {
    const updatedGoals = savedGoals.filter(goal => goal.id !== goalId);
    setSavedGoals(updatedGoals);
    saveGoalsToStorage(updatedGoals);

    // 선택된 날짜의 목표 업데이트
    if (selectedCalendarDate) {
      const updatedDateGoals = updatedGoals.filter(g => g.date === selectedCalendarDate);
      setSelectedDateGoals(updatedDateGoals);

      // 목표가 없으면 달력 뷰로 돌아가기
      if (updatedDateGoals.length === 0) {
        setCurrentScreen(1);
      }
    }
  };

  // 목표 시간으로 정렬
  const sortGoalsByTime = (goals) => {
    return [...goals].sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);

      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      }
      return timeA[1] - timeB[1];
    });
  };

  // 목표 상태에 따른 스타일과 텍스트 가져오기 함수
const getStatusInfo = (status) => {
  switch (status) {
    case GOAL_STATUS.COMPLETED:
      return {
        text: '완료됨',
        style: styles.completedButton,
        textStyle: styles.statusButtonText
      };
    case GOAL_STATUS.FAILED:
      return {
        text: '실패',
        style: styles.failedButton,
        textStyle: styles.statusButtonText
      };
    case GOAL_STATUS.PENDING:
    default:
      return {
        text: '미완료',
        style: styles.pendingButton,
        textStyle: styles.statusButtonText
      };
  }
};


// 타이머 화면으로 이동
const navigateToTimerScreen = (selectedGoal) => {
  // ✅ 유효한 목표인지 확인 (null 또는 빠진 항목 방지)
  if (!selectedGoal || !selectedGoal.time || !selectedGoal.date) {
    console.warn('⚠️ 잘못된 목표 값으로 타이머 진입 시도됨. 실행 중단됨');
    return;
  }

  setSelectedGoalForTimer(selectedGoal);
  setCurrentScreen(3);
};
  // 목표 입력 화면
const GoalInputScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

return (
  <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>목표 설정하기</Text>
      <Text style={styles.subtitleText}>작은 목표부터 하나씩</Text>
    </View>
    <View style={styles.inputContainer}>
      <Text style={styles.label}>달성목표</Text>
      <TouchableOpacity onPress={() => openInputModal('goal')}>
        <View style={styles.input}>
          <Text style={[styles.inputText, goal ? styles.selectedText : {}]}>
            {goal || "목표를 입력하세요"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>

    <View style={styles.inputContainer}>
      <Text style={styles.label}>목표 날짜</Text>
      <TouchableOpacity onPress={() => setShowDateModal(true)}>
        <View style={styles.input}>
          <Text style={[styles.inputText, goalDate ? styles.selectedText : {}]}>
            {goalDate || "날짜를 선택하세요"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>

    <View style={styles.inputContainer}>
      <Text style={styles.label}>목표 시간</Text>
      <TouchableOpacity onPress={() => setShowTimeModal(true)}>
        <View style={styles.input}>
          <Text style={[styles.inputText, goalTime ? styles.selectedText : {}]}>
            {goalTime || "시간을 선택하세요"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>

    <View style={styles.inputContainer}>
      <Text style={styles.label}>성공 보상</Text>
      <TouchableOpacity onPress={() => openInputModal('reward')}>
        <View style={styles.input}>
          <Text style={[styles.inputText, reward ? styles.selectedText : {}]}>
            {reward || "보상을 입력하세요"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>

    <View style={styles.inputContainer}>
      <Text style={styles.label}>실패 제약</Text>
      <TouchableOpacity onPress={() => openInputModal('penalty')}>
        <View style={styles.input}>
          <Text style={[styles.inputText, penalty ? styles.selectedText : {}]}>
            {penalty || "제약을 입력하세요"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>

    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={saveGoal}>
        <Text style={styles.buttonText}>목표 저장</Text>
      </TouchableOpacity>
    </View>
  </Animated.View>
 );
};

  // 목표 달력 화면
  const GoalCalendarScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  return (

    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
      <Text style={styles.title}>목표 캘린더</Text>

      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPrevMonth}>
          <Text style={styles.calendarNavButton}>&lt;</Text>
        </TouchableOpacity>
        <Text style={styles.calendarTitle}>{selectedYear}년 {monthNames[selectedMonth]}</Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <Text style={styles.calendarNavButton}>&gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <Text key={index} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {generateCalendarDays().map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.calendarDay,
              item.isCurrentMonth ? {} : styles.outOfMonthDay,
              selectedCalendarDate === `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}` ? styles.selectedCalendarDay : {}
            ]}
            onPress={() => item.isCurrentMonth && selectCalendarDate(item.day, item.month, item.year)}
            disabled={!item.isCurrentMonth}
          >
            <Text
              style={[
                styles.calendarDayText,
                item.isCurrentMonth ? {} : styles.outOfMonthDayText,
                selectedCalendarDate === `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}` ? styles.selectedCalendarDayText : {}
              ]}
            >
              {item.day}
            </Text>
            {item.isCurrentMonth && hasGoalsOnDate(item.day, item.month, item.year) && (
              <View style={styles.goalDot} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selectedCalendarDate && selectedDateGoals.length === 0 && (
        <View style={styles.noGoalsContainer}>
          <Text style={styles.noGoalsText}>이 날짜에 설정된 목표가 없습니다.</Text>
          <TouchableOpacity
            style={styles.addGoalButton}
            onPress={() => {
    setEditGoalId(null); // ✅ 목표 입력 진입 시 수정모드 초기화
              // 선택된 날짜를 목표 입력 화면에 설정하고 화면 전환
              setGoalDate(selectedCalendarDate);
              setCurrentScreen(0);
            }}
          >
            <Text style={styles.addGoalButtonText}>이 날짜에 목표 추가</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

  // 목표 상세 뷰 화면
   const GoalDetailScreen = () => {
     const sortedGoals = sortGoalsByTime(selectedDateGoals);
     const fadeAnim = useRef(new Animated.Value(0)).current;

     useEffect(() => {
       fadeAnim.setValue(0);
       Animated.timing(fadeAnim, {
         toValue: 1,
         duration: 300,
         useNativeDriver: Platform.OS !== 'web',
       }).start();
     }, []);

     return (
       <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* ✅ 여기에 광고 삽입! */}
             <View style={{ alignItems: 'center', marginBottom: 8 }}>
               <BannerAd
                 unitId={bannerAdUnitId}
                 size={BannerAdSize.ADAPTIVE_BANNER}
                 requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                 onAdFailedToLoad={(err) => console.log('배너 광고 로드 실패:', err)}
               />
             </View>

         <View style={styles.detailHeader}>
           <TouchableOpacity
             style={styles.backButton}
             onPress={navigateToCalendarView}
           >
             <Text style={styles.backButtonText}>&lt; 돌아가기</Text>
           </TouchableOpacity>

           <Text style={styles.detailTitle}>{selectedCalendarDate} 목표</Text>
         </View>

         <FlatList
           data={sortedGoals}
           keyExtractor={(item) => item.id}
           showsVerticalScrollIndicator={false}
           contentContainerStyle={styles.detailListContent}
           renderItem={({ item }) => {
             const statusInfo = getStatusInfo(item.status);

             return (
               <TouchableOpacity
                 style={styles.detailCard}
                 onPress={() => navigateToTimerScreen(item)}
                 activeOpacity={0.7}
               >
                 {/* 카드 헤더 */}
                 <View style={styles.detailCardHeader}>
                   <View style={styles.timeLabel}>
                     <Text style={styles.timeLabelText}>{item.time}</Text>
                   </View>
                   <TouchableOpacity
                     style={[styles.statusButton, statusInfo.style]}
                     onPress={(e) => {
                       e.stopPropagation();
                       setCurrentGoalId(item.id);
                       setShowStatusModal(true);
                     }}
                   >
                     <Text style={statusInfo.textStyle}>
                       {statusInfo.text}
                     </Text>
                   </TouchableOpacity>
                 </View>

                 {/* 목표 제목 */}
                 <Text style={[
                   styles.detailCardTitle,
                   item.status === GOAL_STATUS.COMPLETED
                     ? styles.completedTitleText
                     : item.status === GOAL_STATUS.FAILED
                       ? styles.failedTitleText
                       : {}
                 ]}>
                   {item.goal}
                 </Text>

                 {/* 상세 정보 */}
                 <View style={styles.detailCardContent}>
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>보상:</Text>
                     <Text style={styles.detailValue}>{item.reward || '없음'}</Text>
                   </View>
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>제약:</Text>
                     <Text style={styles.detailValue}>{item.penalty || '없음'}</Text>
                   </View>

                   {/* 진행 상태 바 */}
                   <View style={styles.progressContainer}>
                     <Text style={styles.progressLabel}>진행 상태:</Text>
                     <View style={styles.progressBar}>
                       <View
                         style={[
                           styles.progressFill,
                           {
                             width: item.status === GOAL_STATUS.COMPLETED
                               ? '100%'
                               : item.status === GOAL_STATUS.FAILED
                                 ? '50%'
                                 : '0%',
                             backgroundColor: item.status === GOAL_STATUS.COMPLETED
                               ? '#22c55e'
                               : item.status === GOAL_STATUS.FAILED
                                 ? '#ef4444'
                                 : '#22c55e'
                           }
                         ]}
                       />
                     </View>
                   </View>
                 </View>

                 {/* 수정/삭제 버튼 */}
                 <View style={styles.detailCardActions}>
                   {item.status === GOAL_STATUS.FAILED && (
                      <TouchableOpacity
                        style={[
                          styles.constraintButton,
                          item.constraintStatus === 'completed' && { backgroundColor: '#22c55e' },
                          item.constraintStatus === 'failed' && { backgroundColor: '#ef4444' }
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          setCurrentGoalId(item.id);
                          setShowConstraintOptions(true);
                        }}
                      >
                       <Text style={styles.actionButtonText}>
                           {item.constraintStatus === 'completed'
                             ? '제약완료'
                             : item.constraintStatus === 'failed'
                               ? '제약실패'
                               : '제약 상태'}
                         </Text>
                       </TouchableOpacity>
                     )}
                   <TouchableOpacity
                     style={styles.editButton}
                     onPress={(e) => {
                       e.stopPropagation();
                       const goalToEdit = savedGoals.find(g => g.id === item.id);
                       if (goalToEdit) {
                         setEditGoalId(goalToEdit.id);
                         setEditGoalData({
                           goal: goalToEdit.goal,
                           date: goalToEdit.date,
                           time: goalToEdit.time,
                           reward: goalToEdit.reward || '',
                           penalty: goalToEdit.penalty || ''
                         });
                         setEditGoalModal(true);
                       }
                     }}
                   >
                     <Text style={styles.actionButtonText}>수정</Text>
                   </TouchableOpacity>
                   <TouchableOpacity
                     style={styles.deleteButton}
                     onPress={(e) => {
                       e.stopPropagation();
                       deleteGoal(item.id);
                     }}
                   >
                     <Text style={styles.actionButtonText}>삭제</Text>
                   </TouchableOpacity>
                 </View>
               </TouchableOpacity>
             );
           }}
         />
       </Animated.View>
     );
   };


  // 목표 상태 선택 모달 컴포넌트
  // App.js 내 StatusSelectionModal 컴포넌트
  const StatusSelectionModal = () => (
    <Modal
      visible={showStatusModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>목표 상태 변경</Text>

          <View style={styles.statusButtonsContainer}>
            {/* ✅ 미완료 */}
            <TouchableOpacity
              style={[styles.statusSelectionButton, styles.pendingButton]}
              onPress={() => {
                updateGoalStatus(currentGoalId, GOAL_STATUS.PENDING);
                setShowStatusModal(false);
              }}
            >
              <Text style={styles.statusButtonText}>미완료</Text>
            </TouchableOpacity>

            {/* ✅ 완료됨 */}
            <TouchableOpacity
              style={[styles.statusSelectionButton, styles.completedButton]}
              onPress={() => {
                updateGoalStatus(currentGoalId, GOAL_STATUS.COMPLETED);
                setShowStatusModal(false);
              }}
            >
              <Text style={styles.statusButtonText}>완료됨</Text>
            </TouchableOpacity>

            {/* ✅ 실패 */}
            <TouchableOpacity
              style={[styles.statusSelectionButton, styles.failedButton]}
              onPress={() => {
                updateGoalStatus(currentGoalId, GOAL_STATUS.FAILED);
                setShowStatusModal(false);
              }}
            >
              <Text style={styles.statusButtonText}>실패</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowStatusModal(false)}
          >
            <Text style={styles.modalButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // 🔹 바로 아래에 붙여주세요
  const ConstraintStatusModal = () => (
    <Modal
      visible={showConstraintOptions}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConstraintOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>제약 상태 선택</Text>

          <TouchableOpacity
            style={[styles.statusSelectionButton, { backgroundColor: '#4ade80' }]}
            onPress={() => {
              updateConstraintStatus(currentGoalId, 'completed');
              setShowConstraintOptions(false);
            }}
          >
            <Text style={styles.statusButtonText}>제약완료</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusSelectionButton, { backgroundColor: '#ef4444' }]}
            onPress={() => {
              updateConstraintStatus(currentGoalId, 'failed');
              setShowConstraintOptions(false);
            }}
          >
            <Text style={styles.statusButtonText}>제약실패</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowConstraintOptions(false)}
          >
            <Text style={styles.modalButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );


  // 목표 수정 모달 컴포넌트
  const EditGoalModal = () => (
    <Modal
      visible={editGoalModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setEditGoalModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>목표 수정</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>달성목표</Text>
            <TouchableOpacity onPress={() => openEditInputModal('goal')}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.goal ? styles.selectedText : {}]}>
                  {editGoalData.goal || "목표를 입력하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>목표 날짜</Text>
            <TouchableOpacity onPress={() => {
              // 먼저 수정 모달을 닫고
              setEditGoalModal(false);

              // 날짜 값 설정
              if (editGoalData.date) {
                const [year, month, day] = editGoalData.date.split('-').map(Number);
                setSelectedYear(year);
                setSelectedMonth(month - 1);
                setSelectedDay(day);
              }

              // 약간의 지연 후 날짜 모달 열기
              setTimeout(() => {
                setShowDateModal(true);
              }, 100);
            }}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.date ? styles.selectedText : {}]}>
                  {editGoalData.date || "날짜를 선택하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>목표 시간</Text>
            <TouchableOpacity onPress={() => {
              // 먼저 수정 모달을 닫고
              setEditGoalModal(false);

              // 시간 값 설정
              if (editGoalData.time) {
                const [hour, minute] = editGoalData.time.split(':').map(Number);
                setSelectedHour(hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour));
                setSelectedMinute(minute);
                setSelectedPeriod(hour >= 12 ? 'PM' : 'AM');
              }

              // 약간의 지연 후 시간 모달 열기
              setTimeout(() => {
                setShowTimeModal(true);
              }, 100);
            }}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.time ? styles.selectedText : {}]}>
                  {editGoalData.time || "시간을 선택하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>성공 보상</Text>
            <TouchableOpacity onPress={() => openEditInputModal('reward')}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.reward ? styles.selectedText : {}]}>
                  {editGoalData.reward || "보상을 입력하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>실패 제약</Text>
            <TouchableOpacity onPress={() => openEditInputModal('penalty')}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.penalty ? styles.selectedText : {}]}>
                  {editGoalData.penalty || "제약을 입력하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 버튼을 가로로 배치 */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setEditGoalModal(false)}
            >
              <Text style={styles.modalButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={updateGoal}
            >
              <Text style={styles.modalButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

// 온보딩 화면 컴포넌트
const OnboardingScreen = () => {
  const handleNext = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1);
    }
  };

  const handlePrev = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    setOnboardingStep(1);
  };

  const getOnboardingContent = () => {
    switch (onboardingStep) {
      case 1:
        return {
          title: "목표는 작고, 결심은 단단하게",
          content: "내가 끝낼 수 있는 작은 목표 하나씩.\n\n보상과 제약이 이 앱의 핵심입니다.\n\n제약이 없으면 사람은 움직이지 않습니다.",
          preview: 'goalInput'
        };
      case 2:
        return {
          title: "시간은 갑니다",
          content: "시간이 되면 솔직하게 선택하세요.\n\n완료 / 실패 / 제약실행",
          preview: 'timer'
        };
      case 3:
        return {
          title: "'할 줄 아는 사람'이 되는 과정",
          content: "내가 얼마나 해냈는지 숫자로 확인.\n\n실패에 대한 핑계는 없습니다 오로지 실행뿐.",
          preview: 'statistics'
        };
      default:
        return { title: "", content: "", preview: null };
    }
  };

  const { title, content, preview } = getOnboardingContent();

  // renderPreview 함수를 여기에 정의
const renderPreview = () => {
  const imageSource = onboardingImages[preview];
  if (!imageSource) return null;

  return (
    <View style={styles.previewContainer}>
      <Image source={imageSource} style={styles.previewImage} />
    </View>
  );
};

  return (
    <SafeAreaView style={styles.onboardingContainer}>
      <View style={styles.onboardingContent}>
        <View style={styles.stepIndicatorContainer}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.stepIndicator,
                step === onboardingStep && styles.activeStepIndicator
              ]}
            />
          ))}
        </View>

        <View style={styles.onboardingTextContainer}>
          <Text style={styles.onboardingTitle}>{title}</Text>
          <Text style={styles.onboardingText}>{content}</Text>
        </View>

        {/* 미리보기 화면 */}
        {renderPreview()}

        <View style={styles.onboardingButtonContainer}>
          <View style={styles.onboardingButtonRow}>
            {/* 이전 버튼 - 첫 페이지가 아닐 때만 표시 */}
            {onboardingStep > 1 && (
              <TouchableOpacity
                style={[styles.onboardingButton, styles.prevButton]}
                onPress={handlePrev}
              >
                <Text style={styles.onboardingButtonText}>이전</Text>
              </TouchableOpacity>
            )}

            {/* 다음/시작하기 버튼 */}
            {onboardingStep < 3 ? (
              <TouchableOpacity
                style={[styles.onboardingButton, styles.nextButton]}
                onPress={handleNext}
              >
                <Text style={styles.onboardingButtonText}>다음</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.onboardingButton, styles.startButton]}
                onPress={handleFinish}
              >
                <Text style={styles.onboardingButtonText}>시작하기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* 온보딩 화면 표시 */}
      {showOnboarding ? (
        <OnboardingScreen />
      ) : (
        <>
          {/* 현재 화면에 따라 표시 */}
          {currentScreen === 3 && selectedGoalForTimer ? (
            <TimerScreen
              goal={selectedGoalForTimer}
              onBack={() => setCurrentScreen(2)}
              onComplete={handleTimerComplete}
            />
          ) : currentScreen === 0 ? (
            <GoalInputScreen />
          ) : currentScreen === 1 ? (
            <GoalCalendarScreen />
          ) : currentScreen === 2 ? (
            <GoalDetailScreen />
          ) : (
            <StatisticsScreen />
          )}

          {/* 하단 탭 내비게이션 (타이머 화면에서는 숨김) */}
          {currentScreen !== 3 && (
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabButton, currentScreen === 0 ? styles.activeTab : {}]}
                onPress={() => {
                  if (currentScreen === 0) {
                    setGoal(goal);
                    setGoalDate(goalDate);
                    setGoalTime(goalTime);
                  }
                  setCurrentScreen(0);
                }}
              >
                <Icon
                  name={currentScreen === 0 ? "create" : "create-outline"}
                  size={28}
                  color={currentScreen === 0 ? "white" : "#64748b"}
                  style={{ marginBottom: 0 }}
                />
                <Text style={[styles.tabText, currentScreen === 0 ? styles.activeTabText : {}]}>
                  목표 입력
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, (currentScreen === 1 || currentScreen === 2) ? styles.activeTab : {}]}
                onPress={() => setCurrentScreen(1)}
              >
                <Icon
                  name={(currentScreen === 1 || currentScreen === 2) ? "calendar" : "calendar-outline"}
                  size={28}
                  color={(currentScreen === 1 || currentScreen === 2) ? "white" : "#64748b"}
                  style={{ marginBottom: 0 }}
                />
                <Text style={[styles.tabText, (currentScreen === 1 || currentScreen === 2) ? styles.activeTabText : {}]}>
                  목표 달력
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, currentScreen === 4 ? styles.activeTab : {}]}
                onPress={handleStatisticsTabPress}
              >
                <Icon
                  name={currentScreen === 4 ? "stats-chart" : "stats-chart-outline"}
                  size={28}
                  color={currentScreen === 4 ? "white" : "#64748b"}
                />
                <Text style={[styles.tabText, currentScreen === 4 ? styles.activeTabText : {}]}>
                  통계
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}



      {/* 목표 입력 모달 */}
      <Modal
        visible={showGoalInputModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelInputModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>목표 입력</Text>
            <TextInput
              mode="outlined"
              style={[styles.modalTextInput, styles.modalScrollContent]}
              value={tempGoal}
              onChangeText={setTempGoal}
              placeholder="목표를 입력하세요"
              placeholderTextColor="#6b7280"
              theme={{ colors: { primary: '#4c1d95', background: '#334155' } }}
              outlineColor="#334155"
              activeOutlineColor="#4c1d95"
              textColor="white"
              multiline={true}
              autoFocus={true}
              textAlign="center"
              contentStyle={{
                height: 50, // 고정 높이 유지
                justifyContent: 'center',
                textAlignVertical: 'center',
                paddingVertical: 0 // 패딩 제거
              }}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={cancelInputModal}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveInputModal}
              >
                <Text style={styles.modalButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 보상 입력 모달 */}
      <Modal
        visible={showRewardInputModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelInputModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>보상 입력</Text>
            <TextInput
              mode="outlined"
              style={styles.modalTextInput}
              value={tempReward}
              onChangeText={setTempReward}
              placeholder="보상을 입력하세요"
              placeholderTextColor="#6b7280"
              theme={{ colors: { primary: '#4c1d95', background: '#334155' } }}
              outlineColor="#334155"
              activeOutlineColor="#4c1d95"
              textColor="white"
              multiline={true}
              autoFocus={true}
              textAlign="center"
              textAlignVertical="center"
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={cancelInputModal}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveInputModal}
              >
                <Text style={styles.modalButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 제약 입력 모달 */}
      <Modal
        visible={showPenaltyInputModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelInputModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>제약 입력</Text>
            <TextInput
              mode="outlined"
              style={styles.modalTextInput}
              value={tempPenalty}
              onChangeText={setTempPenalty}
              placeholder="제약을 입력하세요"
              placeholderTextColor="#6b7280"
              theme={{ colors: { primary: '#4c1d95', background: '#334155' } }}
              outlineColor="#334155"
              activeOutlineColor="#4c1d95"
              textColor="white"
              multiline={true}
              autoFocus={true}
              textAlign="center"
              showsVerticalScrollIndicator={false}
              textAlignVertical="center"
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={cancelInputModal}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveInputModal}
              >
                <Text style={styles.modalButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 수정 목표 입력 모달 */}
      <Modal
        visible={showEditGoalInputModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelEditInputModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>목표 입력</Text>
            <TextInput
              mode="outlined"
              style={styles.modalTextInput}
              value={editTempGoal}
              onChangeText={setEditTempGoal}
              placeholder="목표를 입력하세요"
              placeholderTextColor="#6b7280"
              theme={{ colors: { primary: '#4c1d95', background: '#334155' } }}
              outlineColor="#334155"
              activeOutlineColor="#4c1d95"
              textColor="white"
              multiline={true}
              autoFocus={true}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={cancelEditInputModal}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveEditInputModal}
              >
                <Text style={styles.modalButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 수정 보상 입력 모달 */}
      <Modal
        visible={showEditRewardInputModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelEditInputModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>보상 입력</Text>
            <TextInput
              mode="outlined"
              style={styles.modalTextInput}
              value={editTempReward}
              onChangeText={setEditTempReward}
              placeholder="보상을 입력하세요"
              placeholderTextColor="#6b7280"
              theme={{ colors: { primary: '#4c1d95', background: '#334155' } }}
              outlineColor="#334155"
              activeOutlineColor="#4c1d95"
              textColor="white"
              multiline={true}
              autoFocus={true}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={cancelEditInputModal}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveEditInputModal}
              >
                <Text style={styles.modalButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

{/* 수정 제약 입력 모달 */}
<Modal
  visible={showEditPenaltyInputModal}
  transparent={true}
  animationType="fade"
  onRequestClose={cancelEditInputModal}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>제약 입력</Text>
      <TextInput
        mode="outlined"
        style={styles.modalTextInput}
        value={editTempPenalty}
        onChangeText={setEditTempPenalty}
        placeholder="제약을 입력하세요"
        placeholderTextColor="#6b7280"
        theme={{ colors: { primary: '#4c1d95', background: '#334155' } }}
        outlineColor="#334155"
        activeOutlineColor="#4c1d95"
        textColor="white"
        multiline={true}
        autoFocus={true}
      />
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.modalButton}
          onPress={cancelEditInputModal}
        >
          <Text style={styles.modalButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, styles.confirmButton]}
          onPress={saveEditInputModal}
        >
          <Text style={styles.modalButtonText}>저장</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
                    {/* 날짜 선택 모달 */}
                    <Modal
                      visible={showDateModal}
                      transparent={true}
                      animationType="fade"
                      onRequestClose={() => setShowDateModal(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                          <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={goToPrevMonth}>
                              <Text style={styles.modalNavButton}>&lt;</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>{selectedYear}년 {monthNames[selectedMonth]}</Text>
                            <TouchableOpacity onPress={goToNextMonth}>
                              <Text style={styles.modalNavButton}>&gt;</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.calendarContainer}>
                            <View style={styles.weekdayRow}>
                              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                                <Text key={index} style={styles.weekdayText}>{day}</Text>
                              ))}
                            </View>

                            <View style={styles.calendarGrid}>
                              {generateCalendarDays().map((item, index) => (
                                <TouchableOpacity
                                  key={index}
                                  style={[
                                    styles.calendarDay,
                                    item.isCurrentMonth ? {} : styles.outOfMonthDay,
                                    selectedDay === item.day && selectedMonth === item.month && selectedYear === item.year ? styles.selectedDay : {}
                                  ]}
                                  onPress={() => selectDate(item.day, item.month, item.year)}
                                  disabled={!item.isCurrentMonth}
                                >
                                  <Text
                                    style={[
                                      styles.calendarDayText,
                                      item.isCurrentMonth ? {} : styles.outOfMonthDayText,
                                      selectedDay === item.day && selectedMonth === item.month && selectedYear === item.year ? styles.selectedDayText : {}
                                    ]}
                                  >
                                    {item.day}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                          <View style={styles.modalFooter}>
                            <TouchableOpacity
                              style={styles.modalButton}
                              onPress={() => setShowDateModal(false)}
                            >
                              <Text style={styles.modalButtonText}>취소</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Modal>

                    {/* 시간 선택 모달 */}
                    <Modal
                      visible={showTimeModal}
                      transparent={true}
                      animationType="fade"
                      onRequestClose={() => setShowTimeModal(false)}
                    >
                      <View style={[styles.modalOverlay, { zIndex: 2000 }]}>
                        <View style={[styles.modalContent, { zIndex: 2100 }]}>
                          <Text style={styles.timePickerTitle}>시간 선택</Text>

                          <View style={styles.timePickerContainer}>
                            {/* 시간 컬럼 */}
                            <View style={styles.timeColumn}>
                              <Text style={styles.timeColumnLabel}>시</Text>
                              <View style={styles.leftArrowContainer}>
                                <Text style={styles.leftArrow}>▶</Text>
                              </View>
                              <View style={styles.wheelContainer}>
                                <ScrollView
                                  ref={hourScrollViewRef}
                                  showsVerticalScrollIndicator={false}
                                  contentContainerStyle={styles.wheelContentContainer}
                                  nestedScrollEnabled={false}
                                  removeClippedSubviews={true}               // ← 이 줄 추가
                                  scrollEventThrottle={16}
                                  onMomentumScrollEnd={(event) => {
                                    // 스크롤이 멈췄을 때 가장 가까운 항목으로 자동 정렬
                                    const y = event.nativeEvent.contentOffset.y;
                                    const index = Math.round(y / 40) + 1;
                                    if (index >= 1 && index <= 12) {
                                      handleSelectHour(index.toString().padStart(2, '0'));
                                    }
                                  }}
                                >
                                  {hours.map((hour) => (
                                    <TouchableOpacity
                                      key={hour}
                                      style={[
                                        styles.timeOption,
                                        selectedHour === parseInt(hour) ? styles.selectedTimeOption : {}
                                      ]}
                                      onPress={() => handleSelectHour(hour)}
                                    >
                                      <Text style={[
                                        styles.timeOptionText,
                                        selectedHour === parseInt(hour) ? styles.selectedTimeOptionText : {}
                                      ]}>
                                        {hour}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                                <View style={styles.selectionIndicator} />
                              </View>
                            </View>

                            {/* 분 컬럼 */}
                            <View style={styles.timeColumn}>
                              <Text style={styles.timeColumnLabel}>분</Text>
                              <View style={styles.leftArrowContainer}>
                                <Text style={styles.leftArrow}>▶</Text>
                              </View>
                              <View style={styles.wheelContainer}>
                                <ScrollView
                                  ref={minuteScrollViewRef}
                                  showsVerticalScrollIndicator={false}
                                  contentContainerStyle={styles.wheelContentContainer}
                                  nestedScrollEnabled={false}
                                  removeClippedSubviews={true}
                                  scrollEventThrottle={16}
                                  onMomentumScrollEnd={(event) => {
                                    // 스크롤이 멈췄을 때 가장 가까운 항목으로 자동 정렬
                                    const y = event.nativeEvent.contentOffset.y;
                                    const index = Math.round(y / 40);
                                    if (index >= 0 && index <= 59) {
                                      handleSelectMinute(index.toString().padStart(2, '0'));
                                    }
                                  }}
                                >
                                  {minutes.map((minute) => (
                                    <TouchableOpacity
                                      key={minute}
                                      style={[
                                        styles.timeOption,
                                        selectedMinute === parseInt(minute) ? styles.selectedTimeOption : {}
                                      ]}
                                      onPress={() => handleSelectMinute(minute)}
                                    >
                                      <Text style={[
                                        styles.timeOptionText,
                                        selectedMinute === parseInt(minute) ? styles.selectedTimeOptionText : {}
                                      ]}>
                                        {minute}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                                <View style={styles.selectionIndicator} />
                              </View>
                            </View>

                            {/* AM/PM 컬럼 */}
                            <View style={styles.ampmColumn}>
                              <TouchableOpacity
                                style={[
                                  styles.ampmButton,
                                  selectedPeriod === 'AM' ? styles.selectedAmPm : {}
                                ]}
                                onPress={() => setSelectedPeriod('AM')}
                              >
                                <Text style={[
                                  styles.ampmText,
                                  selectedPeriod === 'AM' ? styles.selectedAmPmText : {}
                                ]}>
                                  AM
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.ampmButton,
                                  selectedPeriod === 'PM' ? styles.selectedAmPm : {}
                                ]}
                                onPress={() => setSelectedPeriod('PM')}
                              >
                                <Text style={[
                                  styles.ampmText,
                                  selectedPeriod === 'PM' ? styles.selectedAmPmText : {}
                                ]}>
                                  PM
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.timePickerFooter}>
                            <TouchableOpacity
                              style={styles.timePickerButton}
                              onPress={() => setShowTimeModal(false)}
                            >
                              <Text style={styles.timePickerButtonText}>취소</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.timePickerButton, styles.confirmButton]}
                              onPress={selectTime}
                            >
                              <Text style={styles.timePickerButtonText}>확인</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Modal>

                    {/* 상태 선택 모달 */}
                    <StatusSelectionModal />

                   {/* ✅ 제약 상태 선택 모달 추가 */}
                    <ConstraintStatusModal />

                    {/* 목표 수정 모달 */}
                    <EditGoalModal />
                  </SafeAreaView>
                );
              }

              const styles = StyleSheet.create({
                container: {
                  flex: 1,
                  backgroundColor: '#1e293b',
                  paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
                },
 // 새로 추가되는 스타일들
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  constraintButton: {
    backgroundColor: '#6366f1',   // 인디고색
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
                content: {
                  flex: 1,
                  padding: 16,
                },
                title: {
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: 20,
                  textAlign: 'center',
                },
                inputContainer: {
                  marginBottom: 16,
                },
                label: {
                  fontSize: 16,
                  color: 'white',
                  marginBottom: 8,
                  textAlign: 'center',
                },
                input: {
                  backgroundColor: '#334155',
                  padding: 12,
                  borderRadius: 8,
                  minHeight: 48,
                  color: 'white',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                inputText: {
                  color: '#6b7280',
                  textAlign: 'center',
                },
                selectedText: {
                  color: 'white',
                },
                buttonContainer: {
                  marginTop: 24,
                  alignItems: 'center',
                },
                button: {
                  backgroundColor: '#4c1d95',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                },
                buttonText: {
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                },

                // 모달 입력 스타일
                modalScrollContent: {
                  scrollbarWidth: 'none',  // 웹에서 스크롤바 숨기기
                },
                modalTextInput: {
                  backgroundColor: '#334155',
                  fontSize: 16,
                  height: 60,
                  marginBottom: 16,
                  textAlign: 'center',
                  textAlignVertical: 'center', // 텍스트 수직 중앙 정렬
                  justifyContent: 'center', // 내용 수직 중앙 정렬
                  paddingTop: 0, // 상단 패딩 제거
                  paddingBottom: 0 // 하단 패딩 제거
                },

                // 하단 탭 스타일
                tabBar: {
                  flexDirection: 'row',
                  backgroundColor: '#0f172a',
                  paddingVertical: 0, // 패딩 완전 제거
                  paddingHorizontal: 0, // 패딩 완전 제거
                  borderTopWidth: 1,
                  borderTopColor: '#1e293b',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 60, // 높이 더 줄이기
                  alignItems: 'stretch', // 세로 방향으로 늘리기
                  justifyContent: 'space-between', // 버튼 간 간격 제거
                  elevation: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  margin: 0, // 마진 완전 제거
                },
                tabButton: {
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 0, // 패딩 완전 제거
                  height: '100%', // 탭 바 전체 높이로 설정
                  margin: 0, // 마진 완전 제거
                },
                activeTabIcon: {
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#4c1d95', // 보라색 배경
                  marginBottom: 4,
                },
                inactiveTabIcon: {
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#64748b', // 회색 테두리
                  marginBottom: 4,
                },
                tabText: {
                  fontSize: 12,
                    color: '#94a3b8',
                    marginTop: 2,
                    fontWeight: '500',
                    textAlign: 'center',
                    lineHeight: 14,         // ✅ 줄높이 추가 (기본보다 약간만 높게)
                    includeFontPadding: false, // ✅ Android에서 텍스트 하단 여백 제거
                    paddingBottom: 2        // ✅ 하단 공간 추가로 밀림 방지
                },
                activeTabText: {
                  color: 'white', // 활성화된 탭은 흰색으로
                  fontWeight: 'bold',
                },
                activeTab: {
                  backgroundColor: 'rgba(76, 29, 149, 0.1)', // 활성화된 탭 배경색 약간 추가
                  borderRadius: 10, // 약간의 라운드 처리
                  marginHorizontal: 0, // 좌우 마진 추가
                },

                // 모달 스타일
                modalOverlay: {
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000, // 높은 zIndex 값 추가
                },
                modalContent: {
                  backgroundColor: '#1e293b',
                  borderRadius: 12,
                  width: '90%',
                  maxWidth: 400,
                  padding: 16,
                  zIndex: 1100,
                },
                modalHeader: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
                modalTitle: {
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: 16,
                },
                modalNavButton: {
                  fontSize: 24,
                  color: 'white',
                  padding: 8,
                },
                modalFooter: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 16,
                },
                modalButton: {
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  flex: 1,
                  marginHorizontal: 4,
                  backgroundColor: '#334155',
                },
                confirmButton: {
                  backgroundColor: '#4c1d95',
                },
                modalButtonText: {
                  color: 'white',
                  fontWeight: 'bold',
                },

                // 달력 스타일
                calendarContainer: {
                  marginVertical: 8,
                },
                calendarHeader: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
                calendarTitle: {
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: 'white',
                },
                calendarNavButton: {
                  fontSize: 24,
                  color: 'white',
                  padding: 8,
                },
                weekdayRow: {
                  flexDirection: 'row',
                  marginBottom: 8,
                },
                weekdayText: {
                  flex: 1,
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontWeight: 'bold',
                },
                calendarGrid: {
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                },
                calendarDay: {
                  width: '14.28%',
                  aspectRatio: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginVertical: 2,
                },
                calendarDayText: {
                  color: 'white',
                },
                outOfMonthDay: {
                  opacity: 0.3,
                },
                outOfMonthDayText: {
                  color: '#9ca3af',
                },
                selectedDay: {
                  backgroundColor: '#4c1d95',
                  borderRadius: 999,
                },
                selectedDayText: {
                  color: 'white',
                  fontWeight: 'bold',
                },
                goalDot: {
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#22c55e', // 녹색 점
                  marginTop: 4,
                },

                // 달력 화면 날짜 선택
                selectedCalendarDay: {
                  backgroundColor: '#4c1d95',
                  borderRadius: 999,
                },
                selectedCalendarDayText: {
                  color: 'white',
                  fontWeight: 'bold',
                },
                noGoalsContainer: {
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 40,
                },
                noGoalsText: {
                  color: '#9ca3af',
                  fontSize: 16,
                  marginBottom: 16,
                },
                addGoalButton: {
                  backgroundColor: '#4c1d95',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                },
                addGoalButtonText: {
                  color: 'white',
                  fontWeight: 'bold',
                },

                // 시간 선택기 스타일
                timePickerTitle: {
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: 16,
                },
                timePickerContainer: {
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 16,
                },
                timeColumn: {
                  alignItems: 'center',
                  width: 70,
                  marginHorizontal: 10,
                  position: 'relative',  // 상대적 위치 지정
                },
                timeColumnLabel: {
                  color: '#9ca3af',
                  marginBottom: 8,
                  fontSize: 16,
                },
                wheelContainer: {
                  height: 150,
                  position: 'relative',
                  overflow: 'hidden',
                  borderColor: '#334155',
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 0,
                  alignItems: 'center', // 추가
                  justifyContent: 'center', // 추가
                },
                wheelContentContainer: {
                  paddingVertical: 55,
                  padding: 0,
                },
                timeOption: {
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 60,
                  paddingVertical: 0,
                  alignSelf: 'center',
                },
                timeOptionText: {
                  color: '#9ca3af',
                  fontSize: 24,
                  textAlign: 'center',
                  width: '100%',
                  lineHeight: 28,
                },
                selectedTimeOption: {
                  backgroundColor: 'rgba(76, 29, 149, 1.0)', // 배경색 추가
                  borderRadius: 8, // 모서리 둥글게
                  width: '100%', // 너비 100%
                  alignItems: 'center', // 중앙 정렬
                  height: 40,
                  paddingVertical: 0, // 패딩 값을 0으로 설정
                  justifyContent: 'center', // 세로 중앙 정렬 추가
                  marginVertical: 0,
                },
                selectedTimeOptionText: {
                  color: 'white',
                  fontWeight: 'bold',
                },
                selectionIndicator: {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  marginTop: -20,
                  height: 40,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: '#4c1d95',
                  backgroundColor: 'rgba(76, 29, 149, 0.1)',
                  zIndex: -1,
                },
                leftArrowContainer: {
                  position: 'absolute',
                  left: -15,
                  top: 85, // 수동으로 화살표 위치 조정 (wheelContainer의 중앙 높이로)
                  zIndex: 10,
                  width: 20,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                leftArrow: {
                  color: "white",
                  fontSize: 20,
                  fontWeight: 'bold',
                },
                ampmColumn: {
                  marginLeft: 15,
                  justifyContent: 'center',
                },
                ampmButton: {
                  width: 70,
                  height: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginVertical: 5,
                  borderRadius: 8,
                },
                ampmText: {
                  color: '#9ca3af',
                  fontSize: 22,
                },
                selectedAmPm: {
                  backgroundColor: '#4c1d95',
                },
                selectedAmPmText: {
                  color: 'white',
                  fontWeight: 'bold',
                },
                timePickerFooter: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 20,
                },
                timePickerButton: {
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  flex: 1,
                  marginHorizontal: 4,
                  backgroundColor: '#334155',
                },
                timePickerButtonText: {
                  color: 'white',
                  fontWeight: 'bold',
                },

                // 목표 상세 뷰 스타일
                detailHeader: {
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 20,
                },
                backButton: {
                  marginRight: 16,
                },
                backButtonText: {
                  color: '#8b5cf6',
                  fontSize: 16,
                  fontWeight: 'bold',
                },
                detailTitle: {
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: 'white',
                },
                detailListContent: {
                  paddingBottom: 16,
                },
                detailCard: {
                  backgroundColor: '#334155',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  elevation: 2,
                },
                detailCardHeader: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                },
                timeLabel: {
                  backgroundColor: '#4c1d95',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                },
                timeLabelText: {
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 14,
                },
                statusButton: {
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                },
                statusButtonText: {
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 14,
                },
                detailCardTitle: {
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: 16,
                },
                completedTitleText: {
                  textDecorationLine: 'line-through',
                  color: '#9ca3af',
                },
                failedTitleText: {
                  textDecorationLine: 'line-through',
                  color: '#ef4444', // 실패 색상
                },
                detailCardContent: {
                  backgroundColor: '#1e293b',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                },
                detailRow: {
                  flexDirection: 'row',
                  marginBottom: 8,
                },
                detailLabel: {
                  color: '#9ca3af',
                  width: 60,
                  fontSize: 16,
                },
                detailValue: {
                  color: 'white',
                  flex: 1,
                  fontSize: 16,
                },
                progressContainer: {
                  marginTop: 12,
                },
                progressLabel: {
                  color: '#9ca3af',
                  marginBottom: 8,
                  fontSize: 16,
                },
                progressBar: {
                  height: 8,
                  backgroundColor: '#475569',
                  borderRadius: 4,
                  overflow: 'hidden',
                },
                progressFill: {
                  height: '100%',
                  backgroundColor: '#22c55e',
                  borderRadius: 4,
                },
                detailCardActions: {
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                },
                editButton: {
                  backgroundColor: '#8b5cf6',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginRight: 8,
                },
                deleteButton: {
                  backgroundColor: '#ef4444',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                },
                actionButtonText: {
                  color: 'white',
                  fontWeight: 'bold',
                },

                // 상태 버튼 스타일
                completedButton: {
                  backgroundColor: '#22c55e', // 녹색
                },
                pendingButton: {
                  backgroundColor: '#475569', // 회색
                },
                failedButton: {
                  backgroundColor: '#ef4444', // 빨간색
                },
                constrainedButton: {
                  backgroundColor: '#8b5cf6', // 보라색
                },
                constraintCompletedButton: {
                  backgroundColor: '#6366f1', // 인디고색
                },

                // 상태 모달 스타일
                statusButtonsContainer: {
                  marginBottom: 16
                },
                statusSelectionButton: {
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginBottom: 8,
                },
                // 온보딩 스타일
                onboardingContainer: {
                  flex: 1,
                  backgroundColor: '#1e293b',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                },
                onboardingContent: {
                  flex: 1,
                  width: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 20,
                },
                stepIndicatorContainer: {
                  flexDirection: 'row',
                  marginBottom: 40,
                },
                stepIndicator: {
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#475569',
                  marginHorizontal: 4,
                },
                activeStepIndicator: {
                  backgroundColor: '#8b5cf6',
                  width: 24,
                },
                onboardingTitle: {
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#ffffff',
                  marginBottom: 16,
                  textAlign: 'center',
                },
                onboardingText: {
                  fontSize: 16,
                  color: '#cbd5e1',
                  textAlign: 'center',
                  lineHeight: 24,
                  marginBottom: 24,
                },
                onboardingButtonContainer: {
             marginTop: 'auto',  // 추가
              marginBottom: 40,   // 추가
              width: '100%',
              paddingHorizontal: 24,  // 추가
            },
            onboardingTextContainer: {
              alignItems: 'center',
              marginVertical: 20,
            },
                onboardingButton: {
                  backgroundColor: '#8b5cf6',
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                },
                onboardingButtonText: {
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 'bold',
                },
                onboardingButtonRow: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: 12,
                },
                prevButton: {
                  flex: 1,
                  backgroundColor: '#475569',
                },
                nextButton: {
                  flex: 1,
                },
                startButton: {
                  flex: 1,
                },

                // 온보딩 미리보기 스타일
                previewContainer: {
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginVertical: 20,
                },
                previewScreen: {
                  width: 240,
                  height: 300,
                  backgroundColor: '#334155',
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 8,
                },
                previewTitle: {
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center',
                },
                previewInput: {
                  backgroundColor: '#1e293b',
                  borderRadius: 6,
                  padding: 8,
                  marginBottom: 8,
                },
                previewInputText: {
                  color: '#94a3b8',
                  fontSize: 12,
                  textAlign: 'center',
                },
                previewTimer: {
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                previewTimerText: {
                  color: '#8b5cf6',
                  fontSize: 24,
                  fontWeight: 'bold',
                  marginBottom: 16,
                },
                previewProgressBar: {
                  width: '100%',
                  height: 8,
                  backgroundColor: '#1e293b',
                  borderRadius: 4,
                  overflow: 'hidden',
                },
                previewProgress: {
                  height: '100%',
                  backgroundColor: '#8b5cf6',
                },
                previewStatsTitle: {
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 8,
                },
                previewStatsPercent: {
                  color: '#22c55e',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 16,
                },
                previewChart: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  height: 80,
                  paddingHorizontal: 4,
                },
                previewBarContainer: {
                  flex: 1,
                  marginHorizontal: 2,
                  height: '100%',
                  justifyContent: 'flex-end',
                },
                previewBar: {
                  backgroundColor: '#22c55e',
                  borderRadius: 2,
                  width: '100%',
                },
previewImage: {
  width: 240,
  height: 400,
  borderRadius: 12,
  resizeMode: 'contain',
}
            });
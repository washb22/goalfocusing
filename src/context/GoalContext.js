// src/context/GoalContext.js
// 목표 관련 전역 상태 관리 (위젯 업데이트 포함)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { GOAL_STATUS } from '../constants/goalStatus';
import { SCREENS } from '../constants/screens';
import { 
  saveGoalsToStorage, 
  loadGoalsFromStorage,
  checkStoredGoals 
} from '../utils/storageUtils';
import { scheduleGoalNotification } from '../utils/notificationUtils';
import { getCurrentTimeString, getTodayString, formatDateString } from '../utils/dateUtils';
import { updateAllWidgets } from '../utils/widgetUtils';

const GoalContext = createContext();

export const useGoals = () => {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
};

export const GoalProvider = ({ children }) => {
  // 화면 상태
  const [currentScreen, setCurrentScreen] = useState(SCREENS.GOAL_INPUT);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // 목표 목록
  const [savedGoals, setSavedGoals] = useState([]);
  
  // 목표 입력 폼 상태
  const [goal, setGoal] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalTime, setGoalTime] = useState('');
  const [reward, setReward] = useState('');
  const [penalty, setPenalty] = useState('');
  
  // 선택된 날짜/목표
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
  const [selectedDateGoals, setSelectedDateGoals] = useState([]);
  const [selectedGoalForTimer, setSelectedGoalForTimer] = useState(null);
  
  // 수정 관련 상태
  const [editGoalId, setEditGoalId] = useState(null);
  const [editGoalData, setEditGoalData] = useState({
    goal: '',
    date: '',
    time: '',
    reward: '',
    penalty: '',
  });
  const [editGoalModal, setEditGoalModal] = useState(false);

  // 위젯 업데이트 함수
  const triggerWidgetUpdate = useCallback(async () => {
    if (Platform.OS === 'android') {
      await updateAllWidgets();
    }
  }, []);

  // 목표 저장
  const saveGoal = useCallback(async () => {
    if (!goal || !goalDate || !goalTime) {
      Alert.alert('알림', '목표, 날짜, 시간은 필수 입력 항목입니다.');
      return false;
    }

    const createdAt = getCurrentTimeString();

    const newGoal = {
      id: Date.now().toString(),
      goal,
      date: goalDate,
      time: goalTime,
      reward,
      penalty,
      status: GOAL_STATUS.PENDING,
      constraintStatus: null,
      createdAt,
    };

    const updatedGoals = [...savedGoals, newGoal];
    setSavedGoals(updatedGoals);
    await saveGoalsToStorage(updatedGoals);

    // 푸시 알림 예약
    await scheduleGoalNotification(newGoal);

    // 위젯 업데이트
    await triggerWidgetUpdate();

    // 폼 초기화
    setGoal('');
    setGoalDate('');
    setGoalTime('');
    setReward('');
    setPenalty('');
    setEditGoalId(null);

    Alert.alert('성공', '목표가 성공적으로 저장되었습니다!');
    return true;
  }, [goal, goalDate, goalTime, reward, penalty, savedGoals, triggerWidgetUpdate]);

  // 목표 수정
  const updateGoal = useCallback(async (goalId, updatedData) => {
    const updatedGoals = savedGoals.map(g => 
      g.id === goalId ? { ...g, ...updatedData } : g
    );
    setSavedGoals(updatedGoals);
    await saveGoalsToStorage(updatedGoals);
    await triggerWidgetUpdate();
    
    // 선택된 날짜의 목표 목록도 업데이트
    if (selectedCalendarDate) {
      const dateGoals = updatedGoals.filter(g => g.date === selectedCalendarDate);
      setSelectedDateGoals(dateGoals);
    }
  }, [savedGoals, selectedCalendarDate, triggerWidgetUpdate]);

  // 목표 삭제
  const deleteGoal = useCallback(async (goalId) => {
    const updatedGoals = savedGoals.filter(g => g.id !== goalId);
    setSavedGoals(updatedGoals);
    await saveGoalsToStorage(updatedGoals);
    await triggerWidgetUpdate();
    
    // 선택된 날짜의 목표 목록도 업데이트
    if (selectedCalendarDate) {
      const dateGoals = updatedGoals.filter(g => g.date === selectedCalendarDate);
      setSelectedDateGoals(dateGoals);
    }
  }, [savedGoals, selectedCalendarDate, triggerWidgetUpdate]);

  // 목표 상태 업데이트
  const updateGoalStatus = useCallback(async (goalId, newStatus) => {
    const updatedGoals = savedGoals.map(g => 
      g.id === goalId ? { ...g, status: newStatus } : g
    );
    setSavedGoals(updatedGoals);
    await saveGoalsToStorage(updatedGoals);
    await triggerWidgetUpdate();
    
    // 선택된 날짜의 목표 목록도 업데이트
    if (selectedCalendarDate) {
      const dateGoals = updatedGoals.filter(g => g.date === selectedCalendarDate);
      setSelectedDateGoals(dateGoals);
    }
  }, [savedGoals, selectedCalendarDate, triggerWidgetUpdate]);

  // 제약 상태 업데이트
  const updateConstraintStatus = useCallback(async (goalId, newStatus) => {
    const updatedGoals = savedGoals.map(g => 
      g.id === goalId ? { ...g, constraintStatus: newStatus } : g
    );
    setSavedGoals(updatedGoals);
    await saveGoalsToStorage(updatedGoals);
    await triggerWidgetUpdate();
    
    // 선택된 날짜의 목표 목록도 업데이트
    if (selectedCalendarDate) {
      const dateGoals = updatedGoals.filter(g => g.date === selectedCalendarDate);
      setSelectedDateGoals(dateGoals);
    }
  }, [savedGoals, selectedCalendarDate, triggerWidgetUpdate]);

  // ✅ 타이머 완료 처리 - 상태 업데이트 추가!
  const handleTimerComplete = useCallback(async (goalId, newStatus) => {
    // 상태가 전달되면 업데이트
    if (goalId && newStatus) {
      const updatedGoals = savedGoals.map(g => 
        g.id === goalId ? { ...g, status: newStatus } : g
      );
      setSavedGoals(updatedGoals);
      await saveGoalsToStorage(updatedGoals);
      await triggerWidgetUpdate();
      
      // 선택된 날짜의 목표 목록도 업데이트
      if (selectedCalendarDate) {
        const dateGoals = updatedGoals.filter(g => g.date === selectedCalendarDate);
        setSelectedDateGoals(dateGoals);
      }
    }
    
    // 타이머 완료 시 목표 상세 화면으로 이동
    setCurrentScreen(SCREENS.GOAL_DETAIL);
  }, [savedGoals, selectedCalendarDate, triggerWidgetUpdate]);

  // 특정 날짜에 목표가 있는지 확인
  const hasGoalsOnDate = useCallback((day, month, year) => {
    const dateString = formatDateString(year, month, day);
    return savedGoals.some(g => g.date === dateString);
  }, [savedGoals]);

  // 달력에서 날짜 선택
  const selectCalendarDate = useCallback((day, month, year) => {
    const dateString = formatDateString(year, month, day);
    setSelectedCalendarDate(dateString);
    
    const dateGoals = savedGoals.filter(g => g.date === dateString);
    setSelectedDateGoals(dateGoals);
    
    setCurrentScreen(SCREENS.GOAL_DETAIL);
  }, [savedGoals]);

  // 타이머 화면으로 이동
  const navigateToTimerScreen = useCallback((goalForTimer) => {
    setSelectedGoalForTimer(goalForTimer);
    setCurrentScreen(SCREENS.TIMER);
  }, []);

  // 달력 화면으로 이동
  const navigateToCalendarView = useCallback(() => {
    setCurrentScreen(SCREENS.GOAL_CALENDAR);
  }, []);

  // 수정 모달 열기
  const openEditModal = useCallback((goalToEdit) => {
    setEditGoalId(goalToEdit.id);
    setEditGoalData({
      goal: goalToEdit.goal,
      date: goalToEdit.date,
      time: goalToEdit.time,
      reward: goalToEdit.reward || '',
      penalty: goalToEdit.penalty || '',
    });
    setEditGoalModal(true);
  }, []);

  // 초기 데이터 로드 및 오늘 목표 화면으로 이동
  useEffect(() => {
    const loadInitialData = async () => {
      const goals = await loadGoalsFromStorage();
      if (goals.length > 0) {
        setSavedGoals(goals);
      }
      
      // ✅ 앱 시작 시 오늘 날짜 자동 선택 및 오늘 목표 화면으로 이동
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();
      
      // 오늘 날짜 포맷 (YYYY-MM-DD)
      const todayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setSelectedCalendarDate(todayString);
      
      // 오늘 목표 필터링
      const todayGoals = goals.filter(g => g.date === todayString);
      setSelectedDateGoals(todayGoals);
      
      // 오늘 목표 화면으로 이동
      setCurrentScreen(SCREENS.GOAL_DETAIL);
      
      // 앱 시작 시 위젯 업데이트
      await triggerWidgetUpdate();
    };
    loadInitialData();
  }, [triggerWidgetUpdate]);

  const value = {
    // 화면 상태
    currentScreen,
    setCurrentScreen,
    showOnboarding,
    setShowOnboarding,
    
    // 목표 목록
    savedGoals,
    setSavedGoals,
    
    // 폼 상태
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
    
    // 선택 상태
    selectedCalendarDate,
    setSelectedCalendarDate,
    selectedDateGoals,
    setSelectedDateGoals,
    selectedGoalForTimer,
    setSelectedGoalForTimer,
    
    // 수정 상태
    editGoalId,
    setEditGoalId,
    editGoalData,
    setEditGoalData,
    editGoalModal,
    setEditGoalModal,
    
    // 함수들
    saveGoal,
    updateGoal,
    deleteGoal,
    updateGoalStatus,
    updateConstraintStatus,
    handleTimerComplete,
    hasGoalsOnDate,
    selectCalendarDate,
    navigateToTimerScreen,
    navigateToCalendarView,
    openEditModal,
    triggerWidgetUpdate,
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
};

export default GoalContext;
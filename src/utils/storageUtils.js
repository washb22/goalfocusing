// src/utils/storageUtils.js
// AsyncStorage 관련 유틸리티 함수

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  GOALS: 'savedGoals',
  BIG_GOAL: 'bigGoal',
  ONBOARDING: 'hasSeenOnboarding',
};

/**
 * 목표 데이터를 저장
 */
export const saveGoalsToStorage = async (goals) => {
  try {
    const jsonValue = JSON.stringify(goals);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, jsonValue);
    console.log('목표 데이터 저장 성공:', new Date().toLocaleTimeString());
    return true;
  } catch (error) {
    console.error('목표 데이터 저장 실패:', error);
    return false;
  }
};

/**
 * 목표 데이터를 불러오기
 */
export const loadGoalsFromStorage = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    }
    return [];
  } catch (error) {
    console.error('목표 데이터 불러오기 실패:', error);
    return [];
  }
};

/**
 * 대목표(골포커싱) 저장
 */
export const saveBigGoalToStorage = async (bigGoal) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BIG_GOAL, JSON.stringify(bigGoal));
    return true;
  } catch (error) {
    console.error('골포커싱 저장 실패:', error);
    return false;
  }
};

/**
 * 대목표(골포커싱) 불러오기
 */
export const loadBigGoalFromStorage = async () => {
  try {
    const savedBigGoal = await AsyncStorage.getItem(STORAGE_KEYS.BIG_GOAL);
    if (savedBigGoal) {
      return JSON.parse(savedBigGoal);
    }
    return null;
  } catch (error) {
    console.error('골포커싱 불러오기 실패:', error);
    return null;
  }
};

/**
 * 대목표(골포커싱) 삭제
 */
export const deleteBigGoalFromStorage = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.BIG_GOAL);
    return true;
  } catch (error) {
    console.error('골포커싱 삭제 실패:', error);
    return false;
  }
};

/**
 * 온보딩 완료 표시
 */
export const setOnboardingComplete = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');
    return true;
  } catch (error) {
    console.error('온보딩 상태 저장 실패:', error);
    return false;
  }
};

/**
 * 온보딩 완료 여부 확인
 */
export const hasSeenOnboarding = async () => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
    return value === 'true';
  } catch (error) {
    console.error('온보딩 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 저장된 데이터 확인 (디버깅용)
 */
export const checkStoredGoals = async () => {
  try {
    const storedData = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    const parsedData = JSON.parse(storedData || '[]');
    console.log('=== 저장 상태 확인 ===');
    console.log('저장된 목표 수:', parsedData.length);
    console.log('저장된 목표 목록:', parsedData.map(g => g.goal).join(', '));
    return parsedData;
  } catch (e) {
    console.error('데이터 확인 오류:', e);
    return [];
  }
};

export { STORAGE_KEYS };

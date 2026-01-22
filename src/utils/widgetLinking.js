// src/utils/widgetLinking.js
// 위젯 딥링크 처리 유틸리티

import { Linking, Platform } from 'react-native';
import { SCREENS } from '../constants/screens';

/**
 * 위젯에서 앱이 열렸는지 확인하고 적절한 화면으로 이동
 * @param {Function} setCurrentScreen - 화면 전환 함수
 * @param {Function} selectCalendarDate - 달력 날짜 선택 함수
 */
export const handleWidgetDeepLink = async (setCurrentScreen, selectCalendarDate) => {
  try {
    // 초기 URL 확인 (앱이 딥링크로 열렸을 때)
    const initialUrl = await Linking.getInitialURL();
    
    if (initialUrl) {
      processDeepLink(initialUrl, setCurrentScreen, selectCalendarDate);
    }

    // 앱이 이미 실행 중일 때 딥링크 처리
    const subscription = Linking.addEventListener('url', ({ url }) => {
      processDeepLink(url, setCurrentScreen, selectCalendarDate);
    });

    return subscription;
  } catch (error) {
    console.log('딥링크 처리 에러:', error);
    return null;
  }
};

/**
 * 딥링크 URL 처리
 */
const processDeepLink = (url, setCurrentScreen, selectCalendarDate) => {
  console.log('딥링크 URL:', url);

  if (!url) return;

  // goalfocusing://today -> 오늘 목표 목록으로 이동
  if (url.includes('goalfocusing://today')) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    // 오늘 날짜 선택 후 목표 상세 화면으로 이동
    selectCalendarDate(day, month, year);
    setCurrentScreen(SCREENS.GOAL_DETAIL);
    
    console.log('✅ 위젯에서 오늘 목표 화면으로 이동');
  }
};

export default handleWidgetDeepLink;
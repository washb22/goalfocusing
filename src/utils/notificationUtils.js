// src/utils/notificationUtils.js
// 푸시 알림 관련 유틸리티 함수

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * 알림 권한 요청 및 설정
 */
export const setupNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status !== 'granted') {
    console.log('알림 권한이 거부되었습니다.');
    return false;
  }

  // Android 알림 채널 설정
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

  return true;
};

/**
 * 목표 알림 예약
 */
export const scheduleGoalNotification = async (goal) => {
  try {
    const [hour, minute] = goal.time.split(':').map(Number);
    const targetTime = new Date(goal.date);
    targetTime.setHours(hour, minute, 0);

    // 현재 시간을 KST 기준으로 보정
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const koreaNow = new Date(utc + 9 * 60 * 60 * 1000);

    const secondsUntil = Math.floor((targetTime.getTime() - koreaNow.getTime()) / 1000);

    if (secondsUntil >= 5) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `👏 ${goal.goal}, 이제 결과를 선택할 시간이에요.`,
          body: '완료 처리 또는 제약 설정을 진행해주세요.',
          sound: true,
          data: {
            goalId: goal.id,
            goalTitle: goal.goal,
            goalDate: goal.date,
            goalTime: goal.time,
          },
        },
        trigger: new Date(targetTime.getTime()),
      });
      console.log('✅ 푸시 예약됨:', targetTime.toLocaleString());
      return true;
    } else {
      console.log('❌ 알림 예약 생략: 너무 가까운 시간이거나 지난 목표');
      return false;
    }
  } catch (error) {
    console.error('❌ 푸시 예약 실패:', error);
    return false;
  }
};

/**
 * 타이머 완료 알림
 */
export const sendTimerCompleteNotification = async (goalTitle) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `👏 ${goalTitle}, 이제 결과를 선택할 시간이에요.`,
        body: '완료/실패 처리 또는 제약 설정을 진행해주세요.',
        sound: true,
      },
      trigger: null, // 즉시 발송
    });
    return true;
  } catch (error) {
    console.error('알림 발송 실패:', error);
    return false;
  }
};

/**
 * 모든 예약된 알림 취소
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * 특정 알림 취소
 */
export const cancelNotification = async (notificationId) => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

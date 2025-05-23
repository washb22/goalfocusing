// GoalTimerService.js
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundTimer from 'react-native-background-timer';

class GoalTimerService {
  constructor() {
    this.timerId = null;
    this.backgroundTimerId = null;
    this.notifiedGoals = new Set(); // 알림 발송한 목표 ID 저장
  }

  // 가장 가까운 목표 찾기 (수정)
  findNearestGoal = async () => {
    try {
      const savedGoalsJson = await AsyncStorage.getItem('savedGoals');
      const savedGoals = JSON.parse(savedGoalsJson || '[]');

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // 오늘의 모든 목표 (상태 무관)
      const todayGoals = savedGoals.filter(goal => goal.date === todayStr);

      if (todayGoals.length === 0) return null;

      // 시간순 정렬
      todayGoals.sort((a, b) => {
        const [aH, aM] = a.time.split(':').map(Number);
        const [bH, bM] = b.time.split(':').map(Number);
        return (aH * 60 + aM) - (bH * 60 + bM);
      });

      // 현재 시간 이후의 첫 번째 목표 찾기
      let nearestGoal = null;

      for (const goal of todayGoals) {
        const [hours, minutes] = goal.time.split(':').map(Number);
        const goalTime = new Date();
        goalTime.setHours(hours, minutes, 0);

        const timeDiff = goalTime.getTime() - now.getTime();

        // 아직 시간이 안 지난 목표
        if (timeDiff > 0) {
          nearestGoal = { ...goal, remainingTime: Math.floor(timeDiff / 1000) };
          break;
        }
      }

      return nearestGoal;
    } catch (error) {
      console.error('목표 로드 실패:', error);
      return null;
    }
  };

  // 시간:분 형식으로 포맷팅
  formatTimeDisplay = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  // 진동 알림 발송
  sendVibrationNotification = (goal, type) => {
    const notificationId = type === 'warning' ?
      `warning-${goal.id}` :
      `arrival-${goal.id}`;

    // 이미 발송한 알림인지 확인
    if (this.notifiedGoals.has(notificationId)) {
      return;
    }

    this.notifiedGoals.add(notificationId);

    PushNotification.localNotification({
      channelId: 'goal-timer-vibration',
      title: type === 'warning' ?
        '⏰ 5분 후 목표 시간!' :
        '🎯 목표 시간 도달!',
      message: goal.goal,
      vibration: type === 'warning' ?
        [0, 500] :  // 5분 전: 짧은 진동
        [0, 500, 200, 500, 200, 500],  // 도달: 긴 진동 패턴
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',

      data: {
        goalId: goal.id,
        type: type
      }
    });
  };

  // 고정 알림 업데이트 (수정)
  updatePersistentNotification = async () => {
    const nearestGoal = await this.findNearestGoal();

    if (!nearestGoal) {
      PushNotification.cancelLocalNotification({ id: '999' });
      this.notifiedGoals.clear();
      return;
    }

    // 5분(300초) 이하일 때 경고 알림만 유지
    if (nearestGoal.remainingTime <= 300 && nearestGoal.remainingTime > 240) {
      this.sendVibrationNotification(nearestGoal, 'warning');
    }

    // 목표 시간 도달 진동 알림 제거 (기존 푸시 알림과 중복)
    // if (nearestGoal.remainingTime <= 60 && nearestGoal.remainingTime >= 0) {
    //   this.sendVibrationNotification(nearestGoal, 'arrival');
    // }

    // 시간 표시 - 시:분 형식
    const totalMinutes = Math.ceil(nearestGoal.remainingTime / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let timeDisplay;
    if (hours > 0) {
      timeDisplay = `${hours}:${String(minutes).padStart(2, '0')}`;
    } else {
      timeDisplay = `0:${String(minutes).padStart(2, '0')}`;
    }

    // 기존 알림 업데이트 (동일)
    PushNotification.getScheduledLocalNotifications((notifications) => {
      const existingNotification = notifications.find(n => n.id === '999');

      if (!existingNotification) {
        PushNotification.localNotification({
          channelId: 'goal-timer-persistent',
          id: 999,
          title: nearestGoal.goal,
          message: timeDisplay,
          ongoing: true,
          autoCancel: false,
          vibrate: false,
          playSound: false,
          priority: 'low',
          visibility: 'public',
          importance: 'low',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          showWhen: false,
          onlyAlertOnce: true,
          silent: true,

          data: {
            goalId: nearestGoal.id,
            isPersistent: true
          }
        });
      }
    });
  };

  // 백그라운드 타이머 시작
  startBackgroundTimer = () => {
    // 10초마다 체크 (진동 알림 정확도를 위해)
    this.backgroundTimerId = BackgroundTimer.setInterval(() => {
      this.updatePersistentNotification();
    }, 10000); // 10초
  };

  // 백그라운드 타이머 중지
  stopBackgroundTimer = () => {
    if (this.backgroundTimerId) {
      BackgroundTimer.clearInterval(this.backgroundTimerId);
      this.backgroundTimerId = null;
    }
  };

  // 서비스 시작
  start = () => {
    // 채널 생성
    PushNotification.createChannel({
      channelId: 'goal-timer-persistent',
      channelName: '진행중인 목표',
      channelDescription: '현재 진행중인 목표의 남은 시간을 표시합니다',
      importance: 4,
      vibrate: false,
      playSound: false,
    });

    // 진동 알림용 채널
    PushNotification.createChannel({
      channelId: 'goal-timer-vibration',
      channelName: '목표 알림',
      channelDescription: '목표 시간 도달 알림',
      importance: 5,
      vibrate: true,
      playSound: true,
    });

    // 즉시 업데이트
    this.updatePersistentNotification();

    // 백그라운드 타이머 시작
    this.startBackgroundTimer();
  };

  // 서비스 중지
  stop = () => {
    this.stopBackgroundTimer();
    PushNotification.cancelLocalNotification({ id: '999' });
    this.notifiedGoals.clear();
  };
}

export default new GoalTimerService();
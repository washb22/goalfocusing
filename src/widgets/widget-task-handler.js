// src/widgets/widget-task-handler.js
// 위젯 업데이트 태스크 핸들러

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoalWidget, GoalWidgetSmall } from './GoalWidget';

const WIDGET_NAMES = {
  GOAL_WIDGET: 'GoalWidget',
  GOAL_WIDGET_SMALL: 'GoalWidgetSmall',
};

// 오늘 날짜 문자열 (YYYY-MM-DD)
const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 현재 시간 문자열 (HH:MM)
const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 목표 데이터 불러오기
const loadGoalData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('savedGoals');
    if (jsonValue !== null) {
      const allGoals = JSON.parse(jsonValue);
      const today = getTodayString();
      const currentTime = getCurrentTimeString();

      // 오늘 목표만 필터링
      const todayGoals = allGoals.filter(goal => goal.date === today);

      // 완료/실패 카운트
      const completedCount = todayGoals.filter(g => g.status === 'completed').length;
      const failedCount = todayGoals.filter(g => g.status === 'failed').length;

      // 다음 목표 찾기 (미완료 중 가장 가까운 시간)
      const pendingGoals = todayGoals
        .filter(g => g.status === 'pending' && g.time >= currentTime)
        .sort((a, b) => a.time.localeCompare(b.time));

      const nextGoal = pendingGoals.length > 0 ? pendingGoals[0] : null;

      return {
        todayGoals,
        completedCount,
        failedCount,
        totalCount: todayGoals.length,
        nextGoal,
      };
    }
    return {
      todayGoals: [],
      completedCount: 0,
      failedCount: 0,
      totalCount: 0,
      nextGoal: null,
    };
  } catch (error) {
    console.error('위젯 데이터 로드 실패:', error);
    return {
      todayGoals: [],
      completedCount: 0,
      failedCount: 0,
      totalCount: 0,
      nextGoal: null,
    };
  }
};

// 위젯 태스크 핸들러
export async function widgetTaskHandler(props) {
  const widgetInfo = props.widgetInfo;
  const Widget = widgetInfo.widgetName;

  // 목표 데이터 로드
  const data = await loadGoalData();

  switch (Widget) {
    case WIDGET_NAMES.GOAL_WIDGET:
      return (
        <GoalWidget
          todayGoals={data.todayGoals}
          completedCount={data.completedCount}
          failedCount={data.failedCount}
          nextGoal={data.nextGoal}
        />
      );

    case WIDGET_NAMES.GOAL_WIDGET_SMALL:
      return (
        <GoalWidgetSmall
          completedCount={data.completedCount}
          totalCount={data.totalCount}
        />
      );

    default:
      return (
        <GoalWidget
          todayGoals={data.todayGoals}
          completedCount={data.completedCount}
          failedCount={data.failedCount}
          nextGoal={data.nextGoal}
        />
      );
  }
}

export default widgetTaskHandler;

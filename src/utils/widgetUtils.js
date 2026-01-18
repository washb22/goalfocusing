// src/utils/widgetUtils.js
// 위젯 업데이트 유틸리티 (디버깅용)

import { Platform, NativeModules } from 'react-native';

let requestWidgetUpdate = null;
let widgetAvailable = false;

// Android에서만 위젯 기능 사용
if (Platform.OS === 'android') {
  // 네이티브 모듈 확인
  console.log('=== 위젯 모듈 체크 ===');
  console.log('AndroidWidget 네이티브:', NativeModules.AndroidWidget);
  console.log('AndroidWidgetModule:', NativeModules.AndroidWidgetModule);
  
  try {
    const widget = require('react-native-android-widget');
    console.log('위젯 모듈 로드 성공:', Object.keys(widget));
    requestWidgetUpdate = widget.requestWidgetUpdate;
    
    if (requestWidgetUpdate) {
      widgetAvailable = true;
      console.log('✅ requestWidgetUpdate 함수 사용 가능');
    } else {
      console.log('❌ requestWidgetUpdate 함수 없음');
    }
  } catch (e) {
    console.log('위젯 모듈 로드 실패:', e.message);
    widgetAvailable = false;
  }
}

/**
 * 모든 위젯 업데이트 요청
 */
export const updateAllWidgets = async () => {
  // 위젯 사용 불가능하면 조용히 종료
  if (Platform.OS !== 'android') {
    return;
  }
  
  if (!widgetAvailable || !requestWidgetUpdate) {
    console.log('위젯 업데이트 스킵 (모듈 미연결)');
    return;
  }

  try {
    console.log('위젯 업데이트 시도...');
    
    // GoalWidget 업데이트
    await requestWidgetUpdate({
      widgetName: 'GoalWidget',
      renderWidget: () => require('../widgets/widget-task-handler').widgetTaskHandler({
        widgetInfo: { widgetName: 'GoalWidget' }
      }),
    });

    // GoalWidgetSmall 업데이트
    await requestWidgetUpdate({
      widgetName: 'GoalWidgetSmall',
      renderWidget: () => require('../widgets/widget-task-handler').widgetTaskHandler({
        widgetInfo: { widgetName: 'GoalWidgetSmall' }
      }),
    });

    console.log('✅ 위젯 업데이트 완료');
  } catch (error) {
    // 상세 에러 로그
    console.log('위젯 업데이트 에러:', error.message);
  }
};

/**
 * 특정 위젯만 업데이트
 */
export const updateWidget = async (widgetName) => {
  if (Platform.OS !== 'android' || !widgetAvailable || !requestWidgetUpdate) {
    return;
  }

  try {
    await requestWidgetUpdate({
      widgetName,
      renderWidget: () => require('../widgets/widget-task-handler').widgetTaskHandler({
        widgetInfo: { widgetName }
      }),
    });
    console.log(`${widgetName} 업데이트 완료`);
  } catch (error) {
    console.log(`${widgetName} 업데이트 에러:`, error.message);
  }
};

export default { updateAllWidgets, updateWidget };
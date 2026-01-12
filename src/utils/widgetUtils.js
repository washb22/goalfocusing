// src/utils/widgetUtils.js
// 위젯 업데이트 유틸리티

import { Platform } from 'react-native';

let requestWidgetUpdate;

// Android에서만 위젯 기능 사용
if (Platform.OS === 'android') {
  try {
    const widget = require('react-native-android-widget');
    requestWidgetUpdate = widget.requestWidgetUpdate;
  } catch (e) {
    console.log('Widget module not available');
    requestWidgetUpdate = null;
  }
}

/**
 * 모든 위젯 업데이트 요청
 */
export const updateAllWidgets = async () => {
  if (Platform.OS !== 'android' || !requestWidgetUpdate) {
    return;
  }

  try {
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
    console.error('❌ 위젯 업데이트 실패:', error);
  }
};

/**
 * 특정 위젯만 업데이트
 */
export const updateWidget = async (widgetName) => {
  if (Platform.OS !== 'android' || !requestWidgetUpdate) {
    return;
  }

  try {
    await requestWidgetUpdate({
      widgetName,
      renderWidget: () => require('../widgets/widget-task-handler').widgetTaskHandler({
        widgetInfo: { widgetName }
      }),
    });
    console.log(`✅ ${widgetName} 업데이트 완료`);
  } catch (error) {
    console.error(`❌ ${widgetName} 업데이트 실패:`, error);
  }
};

export default { updateAllWidgets, updateWidget };

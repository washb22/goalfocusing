// index.js
// 위젯 지원이 추가된 앱 엔트리 포인트

console.log('🟢 index.js 진입됨');

import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import App from './App';
import { widgetTaskHandler } from './src/widgets/widget-task-handler';

// 위젯 태스크 핸들러 등록
registerWidgetTaskHandler(widgetTaskHandler);

// 앱 등록
registerRootComponent(App);

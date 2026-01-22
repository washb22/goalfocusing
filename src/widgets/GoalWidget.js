// src/widgets/GoalWidget.js
// 골포커싱 Android 위젯 UI

import React from 'react';
import {
  FlexWidget,
  TextWidget,
} from 'react-native-android-widget';

// 위젯 사이즈별 컴포넌트
export function GoalWidget({ todayGoals = [], completedCount = 0, failedCount = 0, nextGoal = null }) {
  const totalCount = todayGoals.length;
  const pendingCount = totalCount - completedCount - failedCount;
  const achievementRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'goalfocusing://today' }}
    >
      {/* 헤더 */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <TextWidget
          text="🎯"
          style={{
            fontSize: 18,
            marginRight: 8,
          }}
        />
        <TextWidget
          text="골포커싱"
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        />
      </FlexWidget>

      {/* 오늘 목표 현황 */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <FlexWidget style={{ alignItems: 'center', flex: 1 }}>
          <TextWidget
            text={String(totalCount)}
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#8b5cf6',
            }}
          />
          <TextWidget
            text="전체"
            style={{
              fontSize: 12,
              color: '#94a3b8',
            }}
          />
        </FlexWidget>

        <FlexWidget style={{ alignItems: 'center', flex: 1 }}>
          <TextWidget
            text={String(completedCount)}
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#22c55e',
            }}
          />
          <TextWidget
            text="완료"
            style={{
              fontSize: 12,
              color: '#94a3b8',
            }}
          />
        </FlexWidget>

        <FlexWidget style={{ alignItems: 'center', flex: 1 }}>
          <TextWidget
            text={String(pendingCount)}
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#f59e0b',
            }}
          />
          <TextWidget
            text="남음"
            style={{
              fontSize: 12,
              color: '#94a3b8',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* 달성률 바 */}
      <FlexWidget
        style={{
          marginBottom: 12,
        }}
      >
        <TextWidget
          text={`달성률${achievementRate}%`}
          style={{
            fontSize: 12,
            color: '#94a3b8',
            marginBottom: 4,
          }}
        />
        <FlexWidget
          style={{
            height: 8,
            backgroundColor: '#334155',
            borderRadius: 4,
            width: 'match_parent',
          }}
        >
          <FlexWidget
            style={{
              height: 8,
              backgroundColor: '#22c55e',
              borderRadius: 4,
              width: `${achievementRate}%`,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* 다음 목표 */}
      {nextGoal ? (
        <FlexWidget
          style={{
            backgroundColor: '#334155',
            borderRadius: 8,
            padding: 10,
          }}
        >
          <TextWidget
            text="🎯 다음 목표"
            style={{
              fontSize: 12,
              color: '#94a3b8',
              marginBottom: 4,
            }}
          />
          <TextWidget
            text={nextGoal.goal}
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: '#ffffff',
            }}
            truncate="END"
            maxLines={1}
          />
        </FlexWidget>
      ) : (
        <FlexWidget
          style={{
            backgroundColor: '#334155',
            borderRadius: 8,
            padding: 10,
            alignItems: 'center',
          }}
        >
          <TextWidget
            text={totalCount === 0 ? "오늘 목표를 설정해보세요!" : "오늘 목표를 모두 완료했어요! 🎉"}
            style={{
              fontSize: 13,
              color: '#94a3b8',
              textAlign: 'center',
            }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

// 작은 위젯 (2x1)
export function GoalWidgetSmall({ completedCount = 0, totalCount = 0 }) {
  const achievementRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 12,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'goalfocusing://today' }}
    >
      <TextWidget
        text="🎯 골포커싱"
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: 8,
        }}
      />
      <TextWidget
        text={`${completedCount}/${totalCount} 완료`}
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#22c55e',
        }}
      />
      <TextWidget
        text={`달성률 ${achievementRate}%`}
        style={{
          fontSize: 12,
          color: '#94a3b8',
          marginTop: 4,
        }}
      />
    </FlexWidget>
  );
}

export default GoalWidget;
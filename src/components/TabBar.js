// src/components/TabBar.js
// 하단 탭 바 컴포넌트

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../constants/colors';
import { SCREENS } from '../constants/screens';

const TabBar = ({ currentScreen, onChangeScreen, onStatisticsPress }) => {
  const isCalendarActive = currentScreen === SCREENS.GOAL_CALENDAR || currentScreen === SCREENS.GOAL_DETAIL;

  return (
    <View style={styles.tabBar}>
      {/* 목표 입력 탭 */}
      <TouchableOpacity
        style={[styles.tabButton, currentScreen === SCREENS.GOAL_INPUT ? styles.activeTab : {}]}
        onPress={() => onChangeScreen(SCREENS.GOAL_INPUT)}
      >
        <Icon
          name={currentScreen === SCREENS.GOAL_INPUT ? "create" : "create-outline"}
          size={28}
          color={currentScreen === SCREENS.GOAL_INPUT ? COLORS.textPrimary : COLORS.textMuted}
        />
        <Text style={[styles.tabText, currentScreen === SCREENS.GOAL_INPUT ? styles.activeTabText : {}]}>
          목표 입력
        </Text>
      </TouchableOpacity>

      {/* 목표 달력 탭 */}
      <TouchableOpacity
        style={[styles.tabButton, isCalendarActive ? styles.activeTab : {}]}
        onPress={() => onChangeScreen(SCREENS.GOAL_CALENDAR)}
      >
        <Icon
          name={isCalendarActive ? "calendar" : "calendar-outline"}
          size={28}
          color={isCalendarActive ? COLORS.textPrimary : COLORS.textMuted}
        />
        <Text style={[styles.tabText, isCalendarActive ? styles.activeTabText : {}]}>
          목표 달력
        </Text>
      </TouchableOpacity>

      {/* 통계 탭 */}
      <TouchableOpacity
        style={[styles.tabButton, currentScreen === SCREENS.STATISTICS ? styles.activeTab : {}]}
        onPress={onStatisticsPress}
      >
        <Icon
          name={currentScreen === SCREENS.STATISTICS ? "stats-chart" : "stats-chart-outline"}
          size={28}
          color={currentScreen === SCREENS.STATISTICS ? COLORS.textPrimary : COLORS.textMuted}
        />
        <Text style={[styles.tabText, currentScreen === SCREENS.STATISTICS ? styles.activeTabText : {}]}>
          통계
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    alignItems: 'stretch',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeTab: {
    backgroundColor: 'rgba(76, 29, 149, 0.1)',
  },
  tabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
});

export default TabBar;

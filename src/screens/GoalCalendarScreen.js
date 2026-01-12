// src/screens/GoalCalendarScreen.js
// 목표 달력 화면

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { useGoals } from '../context/GoalContext';
import { globalStyles, calendarStyles } from '../styles/globalStyles';
import { SCREENS } from '../constants/screens';
import { generateCalendarDays, formatDateString, MONTH_NAMES, WEEKDAY_NAMES } from '../utils/dateUtils';

const GoalCalendarScreen = () => {
  const { 
    savedGoals,
    selectedCalendarDate,
    selectCalendarDate,
    hasGoalsOnDate,
    setCurrentScreen,
    setGoalDate,
    setEditGoalId,
  } = useGoals();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const calendarDays = generateCalendarDays(selectedYear, selectedMonth);
  const selectedDateGoals = savedGoals.filter(g => g.date === selectedCalendarDate);

  return (
    <Animated.View style={[globalStyles.content, { opacity: fadeAnim }]}>
      {/* 달력 헤더 */}
      <View style={calendarStyles.header}>
        <TouchableOpacity onPress={goToPrevMonth}>
          <Text style={calendarStyles.navButton}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={calendarStyles.title}>
          {selectedYear}년 {MONTH_NAMES[selectedMonth]}
        </Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <Text style={calendarStyles.navButton}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={calendarStyles.weekdayRow}>
        {WEEKDAY_NAMES.map((day, index) => (
          <Text key={index} style={calendarStyles.weekdayText}>{day}</Text>
        ))}
      </View>

      {/* 달력 그리드 */}
      <View style={calendarStyles.grid}>
        {calendarDays.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              calendarStyles.day,
              selectedCalendarDate === formatDateString(item.year, item.month, item.day) 
                ? calendarStyles.selectedDay 
                : {}
            ]}
            onPress={() => item.isCurrentMonth && selectCalendarDate(item.day, item.month, item.year)}
            disabled={!item.isCurrentMonth}
          >
            <Text
              style={[
                calendarStyles.dayText,
                !item.isCurrentMonth ? calendarStyles.outOfMonthDayText : {},
                selectedCalendarDate === formatDateString(item.year, item.month, item.day) 
                  ? calendarStyles.selectedDayText 
                  : {}
              ]}
            >
              {item.day}
            </Text>
            {item.isCurrentMonth && hasGoalsOnDate(item.day, item.month, item.year) && (
              <View style={calendarStyles.goalDot} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* 선택된 날짜에 목표가 없을 때 */}
      {selectedCalendarDate && selectedDateGoals.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
          <Text style={{ color: '#9ca3af', fontSize: 16, marginBottom: 16 }}>
            이 날짜에 설정된 목표가 없습니다.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#4c1d95',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
            onPress={() => {
              setEditGoalId(null);
              setGoalDate(selectedCalendarDate);
              setCurrentScreen(SCREENS.GOAL_INPUT);
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>이 날짜에 목표 추가</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

export default GoalCalendarScreen;

// src/components/modals/DatePickerModal.js
// 날짜 선택 모달

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { generateCalendarDays, MONTH_NAMES, WEEKDAY_NAMES } from '../../utils/dateUtils';

const DatePickerModal = ({ 
  visible, 
  onClose, 
  onSelect, 
  selectedYear: initialYear, 
  selectedMonth: initialMonth,
  selectedDay: initialDay,
}) => {
  const [year, setYear] = useState(initialYear || new Date().getFullYear());
  const [month, setMonth] = useState(initialMonth ?? new Date().getMonth());
  const [day, setDay] = useState(initialDay || new Date().getDate());

  const calendarDays = generateCalendarDays(year, month);

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const handleSelectDate = (selectedDay, selectedMonth, selectedYear) => {
    setDay(selectedDay);
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onSelect(dateString, selectedYear, selectedMonth, selectedDay);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goToPrevMonth}>
              <Text style={styles.navButton}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{year}년 {MONTH_NAMES[month]}</Text>
            <TouchableOpacity onPress={goToNextMonth}>
              <Text style={styles.navButton}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* 요일 */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_NAMES.map((dayName, index) => (
              <Text key={index} style={styles.weekdayText}>{dayName}</Text>
            ))}
          </View>

          {/* 날짜 그리드 */}
          <View style={styles.grid}>
            {calendarDays.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.day,
                  day === item.day && month === item.month && item.isCurrentMonth
                    ? styles.selectedDay
                    : {}
                ]}
                onPress={() => item.isCurrentMonth && handleSelectDate(item.day, item.month, item.year)}
                disabled={!item.isCurrentMonth}
              >
                <Text
                  style={[
                    styles.dayText,
                    !item.isCurrentMonth ? styles.outOfMonthDayText : {},
                    day === item.day && month === item.month && item.isCurrentMonth
                      ? styles.selectedDayText
                      : {}
                  ]}
                >
                  {item.day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  navButton: {
    fontSize: 24,
    color: COLORS.textPrimary,
    padding: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayText: {
    color: COLORS.textPrimary,
  },
  outOfMonthDayText: {
    color: COLORS.textMuted,
    opacity: 0.3,
  },
  selectedDay: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 999,
  },
  selectedDayText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 16,
  },
  button: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
});

export default DatePickerModal;

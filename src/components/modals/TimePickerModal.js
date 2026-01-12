// src/components/modals/TimePickerModal.js
// 시간 선택 모달

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const TimePickerModal = ({ 
  visible, 
  onClose, 
  onSelect,
  initialHour = 12,
  initialMinute = 0,
  initialPeriod = 'AM',
}) => {
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);

  const hourScrollViewRef = useRef(null);
  const minuteScrollViewRef = useRef(null);

  // 시간 배열 (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  // 분 배열 (0-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  useEffect(() => {
    if (visible) {
      // 초기 스크롤 위치 설정
      setTimeout(() => {
        if (hourScrollViewRef.current) {
          hourScrollViewRef.current.scrollTo({
            y: (selectedHour - 1) * 40,
            animated: false
          });
        }
        if (minuteScrollViewRef.current) {
          minuteScrollViewRef.current.scrollTo({
            y: selectedMinute * 40,
            animated: false
          });
        }
      }, 100);
    }
  }, [visible]);

  const handleConfirm = () => {
    let hour = selectedHour;
    if (selectedPeriod === 'PM' && hour < 12) {
      hour += 12;
    } else if (selectedPeriod === 'AM' && hour === 12) {
      hour = 0;
    }

    const timeString = `${String(hour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onSelect(timeString);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>시간 선택</Text>

          <View style={styles.pickerContainer}>
            {/* 시간 스크롤 */}
            <View style={styles.wheelContainer}>
              <ScrollView
                ref={hourScrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={styles.item}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        selectedHour === hour ? styles.selectedItemText : {}
                      ]}
                    >
                      {String(hour).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.separator}>:</Text>

              {/* 분 스크롤 */}
              <ScrollView
                ref={minuteScrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={styles.item}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        selectedMinute === minute ? styles.selectedItemText : {}
                      ]}
                    >
                      {String(minute).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* AM/PM 선택 */}
            <View style={styles.ampmColumn}>
              <TouchableOpacity
                style={[
                  styles.ampmButton,
                  selectedPeriod === 'AM' ? styles.selectedAmPm : {}
                ]}
                onPress={() => setSelectedPeriod('AM')}
              >
                <Text
                  style={[
                    styles.ampmText,
                    selectedPeriod === 'AM' ? styles.selectedAmPmText : {}
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ampmButton,
                  selectedPeriod === 'PM' ? styles.selectedAmPm : {}
                ]}
                onPress={() => setSelectedPeriod('PM')}
              >
                <Text
                  style={[
                    styles.ampmText,
                    selectedPeriod === 'PM' ? styles.selectedAmPmText : {}
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 선택 표시 오버레이 */}
          <View style={styles.selectionOverlay} pointerEvents="none" />

          {/* 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={handleConfirm}
            >
              <Text style={styles.buttonText}>확인</Text>
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
    maxWidth: 350,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelContainer: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'center',
  },
  scrollView: {
    width: 60,
    height: 200,
  },
  scrollContent: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  item: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  itemText: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  selectedItemText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  separator: {
    fontSize: 30,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  ampmColumn: {
    marginLeft: 15,
    justifyContent: 'center',
  },
  ampmButton: {
    width: 70,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 8,
  },
  ampmText: {
    color: COLORS.textMuted,
    fontSize: 22,
  },
  selectedAmPm: {
    backgroundColor: COLORS.primaryDark,
  },
  selectedAmPmText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  selectionOverlay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 100,
    height: 40,
    marginTop: -20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.primaryDark,
    backgroundColor: 'rgba(76, 29, 149, 0.1)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: COLORS.card,
  },
  confirmButton: {
    backgroundColor: COLORS.primaryDark,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
});

export default TimePickerModal;

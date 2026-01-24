// src/components/modals/TimePickerModal.js
// 시간 선택 모달 - 스크롤 멈춤 버그 수정

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';

const ITEM_HEIGHT = 40;

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
  const [isScrolling, setIsScrolling] = useState(false);

  const hourScrollViewRef = useRef(null);
  const minuteScrollViewRef = useRef(null);

  // 시간 배열 (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  // 분 배열 (0-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (visible) {
      setSelectedHour(initialHour);
      setSelectedMinute(initialMinute);
      setSelectedPeriod(initialPeriod);
      setIsScrolling(false);
      
      // 초기 스크롤 위치 설정
      setTimeout(() => {
        if (hourScrollViewRef.current) {
          hourScrollViewRef.current.scrollTo({
            y: (initialHour - 1) * ITEM_HEIGHT,
            animated: false
          });
        }
        if (minuteScrollViewRef.current) {
          minuteScrollViewRef.current.scrollTo({
            y: initialMinute * ITEM_HEIGHT,
            animated: false
          });
        }
      }, 150);
    }
  }, [visible, initialHour, initialMinute, initialPeriod]);

  // 스크롤 중 시간 값 업데이트 (스냅 없이)
  const handleHourScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), hours.length - 1);
    const newHour = hours[clampedIndex];
    if (newHour !== selectedHour) {
      setSelectedHour(newHour);
    }
  };

  // 스크롤 중 분 값 업데이트 (스냅 없이)
  const handleMinuteScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), minutes.length - 1);
    const newMinute = minutes[clampedIndex];
    if (newMinute !== selectedMinute) {
      setSelectedMinute(newMinute);
    }
  };

  // 스크롤 완전히 멈춘 후 스냅 (MomentumScrollEnd에서만)
  const handleHourMomentumEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), hours.length - 1);
    
    // 정확한 위치로 스냅
    hourScrollViewRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true
    });
    
    setSelectedHour(hours[clampedIndex]);
  };

  // 스크롤 완전히 멈춘 후 스냅
  const handleMinuteMomentumEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), minutes.length - 1);
    
    // 정확한 위치로 스냅
    minuteScrollViewRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true
    });
    
    setSelectedMinute(minutes[clampedIndex]);
  };

  // 드래그 끝날 때 (모멘텀 없이 멈춘 경우)
  const handleHourScrollEndDrag = (event) => {
    // 모멘텀이 없으면 직접 스냅
    const velocity = event.nativeEvent.velocity?.y || 0;
    if (Math.abs(velocity) < 0.1) {
      setTimeout(() => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const clampedIndex = Math.min(Math.max(index, 0), hours.length - 1);
        
        hourScrollViewRef.current?.scrollTo({
          y: clampedIndex * ITEM_HEIGHT,
          animated: true
        });
        
        setSelectedHour(hours[clampedIndex]);
      }, 50);
    }
  };

  const handleMinuteScrollEndDrag = (event) => {
    const velocity = event.nativeEvent.velocity?.y || 0;
    if (Math.abs(velocity) < 0.1) {
      setTimeout(() => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const clampedIndex = Math.min(Math.max(index, 0), minutes.length - 1);
        
        minuteScrollViewRef.current?.scrollTo({
          y: clampedIndex * ITEM_HEIGHT,
          animated: true
        });
        
        setSelectedMinute(minutes[clampedIndex]);
      }, 50);
    }
  };

  // 시간 클릭 시 해당 위치로 스크롤
  const handleHourPress = (hour, index) => {
    setSelectedHour(hour);
    hourScrollViewRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true
    });
  };

  // 분 클릭 시 해당 위치로 스크롤
  const handleMinutePress = (minute, index) => {
    setSelectedMinute(minute);
    minuteScrollViewRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true
    });
  };

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
              <View style={styles.scrollWrapper}>
                <ScrollView
                  ref={hourScrollViewRef}
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onScroll={handleHourScroll}
                  onMomentumScrollEnd={handleHourMomentumEnd}
                  onScrollEndDrag={handleHourScrollEndDrag}
                  scrollEventThrottle={16}
                  nestedScrollEnabled={true}
                  bounces={false}
                  overScrollMode="never"
                >
                  {hours.map((hour, index) => (
                    <TouchableOpacity
                      key={hour}
                      style={styles.item}
                      onPress={() => handleHourPress(hour, index)}
                      activeOpacity={0.7}
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
                {/* 선택 영역 표시 */}
                <View style={styles.selectionIndicator} pointerEvents="none" />
              </View>

              <Text style={styles.separator}>:</Text>

              {/* 분 스크롤 */}
              <View style={styles.scrollWrapper}>
                <ScrollView
                  ref={minuteScrollViewRef}
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onScroll={handleMinuteScroll}
                  onMomentumScrollEnd={handleMinuteMomentumEnd}
                  onScrollEndDrag={handleMinuteScrollEndDrag}
                  scrollEventThrottle={16}
                  nestedScrollEnabled={true}
                  bounces={false}
                  overScrollMode="never"
                >
                  {minutes.map((minute, index) => (
                    <TouchableOpacity
                      key={minute}
                      style={styles.item}
                      onPress={() => handleMinutePress(minute, index)}
                      activeOpacity={0.7}
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
                {/* 선택 영역 표시 */}
                <View style={styles.selectionIndicator} pointerEvents="none" />
              </View>
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
  scrollWrapper: {
    position: 'relative',
    height: 200,
    width: 60,
    overflow: 'hidden',
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
    height: ITEM_HEIGHT,
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
  selectionIndicator: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
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
    backgroundColor: COLORS.card,
    marginHorizontal: 4,
  },
  confirmButton: {
    backgroundColor: COLORS.primaryDark,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TimePickerModal;
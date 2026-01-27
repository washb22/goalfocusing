// src/components/modals/TimePickerModal.js
// 시간 선택 모달 - synthetic event pooling 버그 수정

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
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

  const hourScrollViewRef = useRef(null);
  const minuteScrollViewRef = useRef(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  useEffect(() => {
    if (visible) {
      setSelectedHour(initialHour);
      setSelectedMinute(initialMinute);
      setSelectedPeriod(initialPeriod);
      
      const timer = setTimeout(() => {
        try {
          if (hourScrollViewRef.current?.scrollTo) {
            hourScrollViewRef.current.scrollTo({
              y: (initialHour - 1) * ITEM_HEIGHT,
              animated: false
            });
          }
          if (minuteScrollViewRef.current?.scrollTo) {
            minuteScrollViewRef.current.scrollTo({
              y: initialMinute * ITEM_HEIGHT,
              animated: false
            });
          }
        } catch (error) {}
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [visible, initialHour, initialMinute, initialPeriod]);

  const handleHourScroll = (event) => {
    const offsetY = event.nativeEvent?.contentOffset?.y;
    if (offsetY === undefined || offsetY === null) return;
    
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), hours.length - 1);
    const newHour = hours[clampedIndex];
    if (newHour !== selectedHour) {
      setSelectedHour(newHour);
    }
  };

  const handleMinuteScroll = (event) => {
    const offsetY = event.nativeEvent?.contentOffset?.y;
    if (offsetY === undefined || offsetY === null) return;
    
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), minutes.length - 1);
    const newMinute = minutes[clampedIndex];
    if (newMinute !== selectedMinute) {
      setSelectedMinute(newMinute);
    }
  };

  const handleHourMomentumEnd = (event) => {
    const offsetY = event.nativeEvent?.contentOffset?.y;
    if (offsetY === undefined || offsetY === null) return;
    
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), hours.length - 1);
    
    if (hourScrollViewRef.current?.scrollTo) {
      hourScrollViewRef.current.scrollTo({
        y: clampedIndex * ITEM_HEIGHT,
        animated: true
      });
    }
    setSelectedHour(hours[clampedIndex]);
  };

  const handleMinuteMomentumEnd = (event) => {
    const offsetY = event.nativeEvent?.contentOffset?.y;
    if (offsetY === undefined || offsetY === null) return;
    
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), minutes.length - 1);
    
    if (minuteScrollViewRef.current?.scrollTo) {
      minuteScrollViewRef.current.scrollTo({
        y: clampedIndex * ITEM_HEIGHT,
        animated: true
      });
    }
    setSelectedMinute(minutes[clampedIndex]);
  };

  // ✅ 핵심 수정: setTimeout 호출 전에 모든 값 추출
  const handleHourScrollEndDrag = (event) => {
    const offsetY = event.nativeEvent?.contentOffset?.y;
    const velocity = event.nativeEvent?.velocity?.y || 0;
    
    if (offsetY === undefined || offsetY === null) return;
    
    if (Math.abs(velocity) < 0.1) {
      setTimeout(() => {
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const clampedIndex = Math.min(Math.max(index, 0), hours.length - 1);
        
        if (hourScrollViewRef.current?.scrollTo) {
          hourScrollViewRef.current.scrollTo({
            y: clampedIndex * ITEM_HEIGHT,
            animated: true
          });
        }
        setSelectedHour(hours[clampedIndex]);
      }, 50);
    }
  };

  // ✅ 핵심 수정: setTimeout 호출 전에 모든 값 추출
  const handleMinuteScrollEndDrag = (event) => {
    const offsetY = event.nativeEvent?.contentOffset?.y;
    const velocity = event.nativeEvent?.velocity?.y || 0;
    
    if (offsetY === undefined || offsetY === null) return;
    
    if (Math.abs(velocity) < 0.1) {
      setTimeout(() => {
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const clampedIndex = Math.min(Math.max(index, 0), minutes.length - 1);
        
        if (minuteScrollViewRef.current?.scrollTo) {
          minuteScrollViewRef.current.scrollTo({
            y: clampedIndex * ITEM_HEIGHT,
            animated: true
          });
        }
        setSelectedMinute(minutes[clampedIndex]);
      }, 50);
    }
  };

  const handleHourPress = (hour, index) => {
    setSelectedHour(hour);
    if (hourScrollViewRef.current?.scrollTo) {
      hourScrollViewRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
  };

  const handleMinutePress = (minute, index) => {
    setSelectedMinute(minute);
    if (minuteScrollViewRef.current?.scrollTo) {
      minuteScrollViewRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
  };

  const handleConfirm = () => {
    let hour = selectedHour;
    if (selectedPeriod === 'PM' && hour < 12) hour += 12;
    else if (selectedPeriod === 'AM' && hour === 12) hour = 0;

    const timeString = `${String(hour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onSelect(timeString);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>시간 선택</Text>
          <View style={styles.pickerContainer}>
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
                    <TouchableOpacity key={hour} style={styles.item} onPress={() => handleHourPress(hour, index)} activeOpacity={0.7}>
                      <Text style={[styles.itemText, selectedHour === hour ? styles.selectedItemText : {}]}>
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.selectionIndicator} pointerEvents="none" />
              </View>
              <Text style={styles.separator}>:</Text>
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
                    <TouchableOpacity key={minute} style={styles.item} onPress={() => handleMinutePress(minute, index)} activeOpacity={0.7}>
                      <Text style={[styles.itemText, selectedMinute === minute ? styles.selectedItemText : {}]}>
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.selectionIndicator} pointerEvents="none" />
              </View>
            </View>
            <View style={styles.ampmColumn}>
              <TouchableOpacity style={[styles.ampmButton, selectedPeriod === 'AM' ? styles.selectedAmPm : {}]} onPress={() => setSelectedPeriod('AM')}>
                <Text style={[styles.ampmText, selectedPeriod === 'AM' ? styles.selectedAmPmText : {}]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ampmButton, selectedPeriod === 'PM' ? styles.selectedAmPm : {}]} onPress={() => setSelectedPeriod('PM')}>
                <Text style={[styles.ampmText, selectedPeriod === 'PM' ? styles.selectedAmPmText : {}]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
              <Text style={styles.buttonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: COLORS.background, borderRadius: 12, width: '90%', maxWidth: 350, padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 20 },
  pickerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  wheelContainer: { flexDirection: 'row', height: 200, alignItems: 'center' },
  scrollWrapper: { position: 'relative', height: 200, width: 60, overflow: 'hidden' },
  scrollView: { width: 60, height: 200 },
  scrollContent: { paddingVertical: 80, alignItems: 'center' },
  item: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', width: 60 },
  itemText: { fontSize: 24, color: COLORS.textMuted },
  selectedItemText: { color: COLORS.textPrimary, fontWeight: 'bold' },
  selectionIndicator: { position: 'absolute', top: 80, left: 0, right: 0, height: ITEM_HEIGHT, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.primary, backgroundColor: 'transparent' },
  separator: { fontSize: 30, color: COLORS.textPrimary, fontWeight: 'bold', marginHorizontal: 5 },
  ampmColumn: { marginLeft: 15, justifyContent: 'center' },
  ampmButton: { width: 70, height: 50, justifyContent: 'center', alignItems: 'center', marginVertical: 5, borderRadius: 8 },
  ampmText: { color: COLORS.textMuted, fontSize: 22 },
  selectedAmPm: { backgroundColor: COLORS.primaryDark },
  selectedAmPmText: { color: COLORS.textPrimary, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 4 },
  confirmButton: { backgroundColor: COLORS.primaryDark },
  buttonText: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
});

export default TimePickerModal;
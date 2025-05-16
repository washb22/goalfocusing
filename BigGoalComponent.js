// BigGoalComponent.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 날짜 선택기 컴포넌트
// 참고: 실제 앱에 추가할 때는 아래 모듈 설치 필요
// npm install react-native-modal-datetime-picker @react-native-community/datetimepicker
// 임포트 코드:
// import DateTimePickerModal from 'react-native-modal-datetime-picker';

// 대목표 컴포넌트 - 화면에 표시될 대목표 카드
const BigGoalComponent = ({ existingBigGoal, onEdit }) => {
  const [daysRemaining, setDaysRemaining] = useState(0);
  
  useEffect(() => {
    if (existingBigGoal && existingBigGoal.targetDate) {
      calculateDaysRemaining(existingBigGoal.targetDate);
    }
  }, [existingBigGoal]);
  
  // 남은 일수 계산 함수
  const calculateDaysRemaining = (targetDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 부분 제거
    
    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0); // 시간 부분 제거
    
    const timeDiff = targetDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    setDaysRemaining(daysDiff > 0 ? daysDiff : 0);
  };
  
  // 대목표가 없는 경우
  if (!existingBigGoal) {
    return (
      <TouchableOpacity style={styles.bigGoalEmptyCard} onPress={onEdit}>
        <Text style={styles.bigGoalEmptyText}>대목표 설정하기</Text>
        <Text style={styles.bigGoalEmptySubtext}>장기적인 목표를 설정하고 매일 동기부여를 받으세요</Text>
      </TouchableOpacity>
    );
  }
  
  // 대목표가 있는 경우
  return (
    <View style={styles.bigGoalCard}>
      <View style={styles.bigGoalHeader}>
        <Text style={styles.bigGoalTitle}>나의 대목표</Text>
        <TouchableOpacity style={styles.bigGoalEditButton} onPress={onEdit}>
          <Text style={styles.bigGoalEditText}>편집</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.bigGoalText}>{existingBigGoal.title}</Text>
      
      <View style={styles.bigGoalCountdown}>
        <Text style={styles.bigGoalDaysLabel}>목표일까지</Text>
        <View style={styles.bigGoalDaysContainer}>
          <Text style={styles.bigGoalDaysNumber}>{daysRemaining}</Text>
          <Text style={styles.bigGoalDaysText}>일 남았습니다</Text>
        </View>
      </View>
      
      <View style={styles.bigGoalDateRow}>
        <View style={styles.bigGoalDateItem}>
          <Text style={styles.bigGoalDateLabel}>시작일</Text>
          <Text style={styles.bigGoalDateValue}>
            {existingBigGoal.startDate || '미설정'}
          </Text>
        </View>
        
        <View style={styles.bigGoalDateDivider} />
        
        <View style={styles.bigGoalDateItem}>
          <Text style={styles.bigGoalDateLabel}>목표일</Text>
          <Text style={styles.bigGoalDateValue}>
            {existingBigGoal.targetDate || '미설정'}
          </Text>
        </View>
      </View>
      
      {/* 모티베이션 메시지 */}
      <Text style={styles.bigGoalMotivationText}>
        {daysRemaining > 30 
          ? '천천히 꾸준하게 진행하세요.' 
          : daysRemaining > 7 
            ? '목표 달성이 가까워지고 있어요!' 
            : '마지막 스퍼트! 할 수 있어요!'}
      </Text>
    </View>
  );
};

// 대목표 설정 모달
const BigGoalEditModal = ({ visible, onClose, onSave, initialBigGoal }) => {
  const [bigGoalTitle, setBigGoalTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isTargetDate, setIsTargetDate] = useState(true); // 시작일/목표일 구분
  
  useEffect(() => {
    if (initialBigGoal) {
      setBigGoalTitle(initialBigGoal.title || '');
      setTargetDate(initialBigGoal.targetDate || '');
    } else {
      // 새 대목표인 경우 기본값 설정
      setBigGoalTitle('');
      setTargetDate('');
    }
  }, [initialBigGoal, visible]);
  
  // 날짜 선택 후 처리
  // 실제 앱에서는 DatePicker 라이브러리에서 받은 날짜를 처리하는 함수
  const handleDateConfirm = (date) => {
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD 포맷
    
    if (isTargetDate) {
      setTargetDate(formattedDate);
    }
    
    setShowDatePicker(false);
  };
  
  // 임시 날짜 선택 처리 (DatePicker 없이 테스트용)
  const handleDateSelect = () => {
    // 테스트용: 현재 날짜로부터 30일 후를 목표일로 설정
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const formattedDate = futureDate.toISOString().split('T')[0];
    setTargetDate(formattedDate);
  };
  
  const handleSave = () => {
    // 기본 시작일은 오늘
    const today = new Date().toISOString().split('T')[0];
    
    onSave({
      title: bigGoalTitle,
      startDate: today, // 향후 시작일 선택 기능 추가 시 수정
      targetDate: targetDate,
    });
    
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>대목표 설정</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>목표 이름</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="대목표를 입력하세요 (예: 살 20kg 빼기)"
              placeholderTextColor="#94a3b8"
              value={bigGoalTitle}
              onChangeText={setBigGoalTitle}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>목표 달성일</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              // 실제 앱에서는 DatePicker를 열고, 테스트에서는 임시 함수 호출
              onPress={handleDateSelect}
            >
              <Text style={targetDate ? styles.dateInputText : styles.dateInputPlaceholder}>
                {targetDate || '목표 달성일을 선택하세요'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalTipContainer}>
            <Text style={styles.modalTipTitle}>💡 설정 팁</Text>
            <Text style={styles.modalTipText}>
              구체적인 날짜를 설정하면 목표 달성에 더 도움이 됩니다.
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.modalConfirm,
                (!bigGoalTitle || !targetDate) && styles.modalConfirmDisabled
              ]} 
              onPress={handleSave}
              disabled={!bigGoalTitle || !targetDate}
            >
              <Text style={styles.modalConfirmText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* DatePicker 컴포넌트는 실제 앱에서 추가 */}
      {/* 여기에 DateTimePickerModal 컴포넌트가 들어갑니다 */}
    </Modal>
  );
};

// BigGoal 컨테이너 컴포넌트 - 앱의 메인 화면에 포함될 컴포넌트
const BigGoalContainer = () => {
  const [bigGoal, setBigGoal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 저장된 대목표 불러오기
  useEffect(() => {
    const loadBigGoal = async () => {
      try {
        const savedBigGoal = await AsyncStorage.getItem('bigGoal');
        if (savedBigGoal) {
          setBigGoal(JSON.parse(savedBigGoal));
        }
      } catch (error) {
        console.error('대목표 불러오기 실패:', error);
      }
    };
    
    loadBigGoal();
  }, []);
  
  // 대목표 저장
  const saveBigGoal = async (newBigGoal) => {
    try {
      await AsyncStorage.setItem('bigGoal', JSON.stringify(newBigGoal));
      setBigGoal(newBigGoal);
    } catch (error) {
      console.error('대목표 저장 실패:', error);
    }
  };
  
  return (
    <>
      {/* 대목표 컴포넌트 */}
      <BigGoalComponent 
        existingBigGoal={bigGoal} 
        onEdit={() => setShowEditModal(true)} 
      />
      
      {/* 대목표 수정 모달 */}
      <BigGoalEditModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={saveBigGoal}
        initialBigGoal={bigGoal}
      />
    </>
  );
};

// 스타일
const styles = StyleSheet.create({
  // 대목표 카드 - 비어있을 때
  bigGoalEmptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  bigGoalEmptyText: {
    color: '#8b5cf6',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bigGoalEmptySubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // 대목표 카드 - 있을 때
  bigGoalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bigGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bigGoalTitle: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bigGoalEditButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bigGoalEditText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bigGoalText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bigGoalCountdown: {
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 12,
  },
  bigGoalDaysLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  bigGoalDaysContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigGoalDaysNumber: {
    color: '#8b5cf6',
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 4,
  },
  bigGoalDaysText: {
    color: '#ffffff',
    fontSize: 16,
  },
  bigGoalDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  bigGoalDateItem: {
    flex: 1,
    alignItems: 'center',
  },
  bigGoalDateDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  bigGoalDateLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  bigGoalDateValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bigGoalMotivationText: {
    color: '#8b5cf6',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#334155',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dateInput: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateInputText: {
    color: '#ffffff',
    fontSize: 16,
  },
  dateInputPlaceholder: {
    color: '#94a3b8',
    fontSize: 16,
  },
  modalTipContainer: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  modalTipTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalTipText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmDisabled: {
    backgroundColor: '#4c1d95',
    opacity: 0.5,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export { BigGoalContainer, BigGoalComponent };
export default BigGoalContainer;
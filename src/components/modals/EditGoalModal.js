// src/components/modals/EditGoalModal.js
// 목표 수정 모달

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { useGoals } from '../../context/GoalContext';

const EditGoalModal = ({ 
  onOpenDateModal,
  onOpenTimeModal,
  onOpenInputModal,
}) => {
  const {
    editGoalModal,
    setEditGoalModal,
    editGoalData,
    updateGoal,
  } = useGoals();

  return (
    <Modal 
      visible={editGoalModal} 
      transparent 
      animationType="fade" 
      onRequestClose={() => setEditGoalModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>목표 수정</Text>

          {/* 달성목표 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>달성목표</Text>
            <TouchableOpacity onPress={() => onOpenInputModal('goal')}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.goal ? styles.selectedText : {}]}>
                  {editGoalData.goal || "목표를 입력하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 목표 날짜 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>목표 날짜</Text>
            <TouchableOpacity onPress={onOpenDateModal}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.date ? styles.selectedText : {}]}>
                  {editGoalData.date || "날짜를 선택하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 목표 시간 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>목표 시간</Text>
            <TouchableOpacity onPress={onOpenTimeModal}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.time ? styles.selectedText : {}]}>
                  {editGoalData.time || "시간을 선택하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 성공 보상 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>성공 보상</Text>
            <TouchableOpacity onPress={() => onOpenInputModal('reward')}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.reward ? styles.selectedText : {}]}>
                  {editGoalData.reward || "보상을 입력하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 실패 제약 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>실패 제약</Text>
            <TouchableOpacity onPress={() => onOpenInputModal('penalty')}>
              <View style={styles.input}>
                <Text style={[styles.inputText, editGoalData.penalty ? styles.selectedText : {}]}>
                  {editGoalData.penalty || "제약을 입력하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setEditGoalModal(false)}
            >
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={updateGoal}
            >
              <Text style={styles.buttonText}>저장</Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  inputText: {
    color: COLORS.textMuted,
  },
  selectedText: {
    color: COLORS.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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

export default EditGoalModal;

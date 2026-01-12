// src/components/modals/StatusSelectionModal.js
// 목표 상태 선택 모달

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { GOAL_STATUS } from '../../constants/goalStatus';

const StatusSelectionModal = ({ 
  visible, 
  onClose, 
  onSelect,
  goalId,
}) => {
  const handleSelect = (status) => {
    onSelect(goalId, status);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>상태 선택</Text>

          <TouchableOpacity
            style={[styles.statusButton, styles.completedButton]}
            onPress={() => handleSelect(GOAL_STATUS.COMPLETED)}
          >
            <Text style={styles.statusButtonText}>✅ 완료</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, styles.failedButton]}
            onPress={() => handleSelect(GOAL_STATUS.FAILED)}
          >
            <Text style={styles.statusButtonText}>❌ 실패</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, styles.pendingButton]}
            onPress={() => handleSelect(GOAL_STATUS.PENDING)}
          >
            <Text style={styles.statusButtonText}>⏳ 미완료</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// 제약 상태 선택 모달
export const ConstraintStatusModal = ({ 
  visible, 
  onClose, 
  onSelect,
  goalId,
}) => {
  const handleSelect = (status) => {
    onSelect(goalId, status);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>제약 상태 선택</Text>

          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: '#4ade80' }]}
            onPress={() => handleSelect('completed')}
          >
            <Text style={styles.statusButtonText}>✅ 제약 완료</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: '#ef4444' }]}
            onPress={() => handleSelect('failed')}
          >
            <Text style={styles.statusButtonText}>❌ 제약 실패</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
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
    width: '80%',
    maxWidth: 300,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  statusButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  completedButton: {
    backgroundColor: COLORS.success,
  },
  failedButton: {
    backgroundColor: COLORS.error,
  },
  pendingButton: {
    backgroundColor: COLORS.cardLight,
  },
  statusButtonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginTop: 10,
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
});

export default StatusSelectionModal;

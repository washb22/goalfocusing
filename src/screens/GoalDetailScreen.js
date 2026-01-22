// src/screens/GoalDetailScreen.js
// 목표 상세 화면 (공유 기능 포함 - 네이티브 모듈 불필요)

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useGoals } from '../context/GoalContext';
import { COLORS } from '../constants/colors';
import { GOAL_STATUS, CONSTRAINT_STATUS } from '../constants/goalStatus';
import { sortGoalsByTime, formatDateString } from '../utils/dateUtils';
import ShareModal, { SHARE_TYPE } from '../components/modals/ShareModal';

const GoalDetailScreen = ({
  onOpenStatusModal,
  onOpenConstraintModal,
}) => {
  const {
    selectedCalendarDate,
    selectedDateGoals,
    navigateToTimerScreen,
    navigateToCalendarView,
    openEditModal,
    deleteGoal,
  } = useGoals();

  // 공유 모달 상태
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedGoalForShare, setSelectedGoalForShare] = useState(null);
  const [shareType, setShareType] = useState(SHARE_TYPE.DECLARATION);

  const sortedGoals = sortGoalsByTime(selectedDateGoals);

  // 목표 선언 공유
  const handleShareDeclaration = (goal) => {
    setSelectedGoalForShare(goal);
    setShareType(SHARE_TYPE.DECLARATION);
    setShareModalVisible(true);
  };

  // 결과 공유
  const handleShareResult = (goal) => {
    setSelectedGoalForShare(goal);
    setShareType(SHARE_TYPE.RESULT);
    setShareModalVisible(true);
  };

  // 삭제 확인
  const handleDeleteGoal = (goalId) => {
    Alert.alert(
      '목표 삭제',
      '정말 이 목표를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => deleteGoal(goalId),
        },
      ]
    );
  };

  // 상태에 따른 배경색
  const getStatusColor = (status) => {
    switch (status) {
      case GOAL_STATUS.COMPLETED: return COLORS.statusSuccess;
      case GOAL_STATUS.FAILED: return COLORS.statusFailed;
      default: return COLORS.card;
    }
  };

  // 상태 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case GOAL_STATUS.COMPLETED: return '✅ 완료';
      case GOAL_STATUS.FAILED: return '❌ 실패';
      default: return '⏳ 진행중';
    }
  };

  // 제약 상태 텍스트
  const getConstraintText = (status) => {
    switch (status) {
      case CONSTRAINT_STATUS.KEPT: return '✅ 지킴';
      case CONSTRAINT_STATUS.BROKEN: return '❌ 못지킴';
      default: return '선택';
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateToCalendarView} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 달력</Text>
        </TouchableOpacity>
        <Text style={styles.dateTitle}>{selectedCalendarDate}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 목표 목록 */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sortedGoals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>이 날짜에 목표가 없습니다</Text>
          </View>
        ) : (
          sortedGoals.map((goal) => (
            <View 
              key={goal.id} 
              style={styles.goalCard}
            >
              {/* 목표 정보 */}
              <View style={styles.goalInfo}>
                <Text style={styles.goalTime}>{goal.time}</Text>
                <Text style={styles.goalTitle}>{goal.goal}</Text>
                
                {goal.reward && (
                  <Text style={styles.rewardText}>🎁 보상: {goal.reward}</Text>
                )}
                {goal.penalty && (
                  <Text style={styles.penaltyText}>⚠️ 제약: {goal.penalty}</Text>
                )}
              </View>

              {/* 상태 표시 */}
              <View style={styles.statusContainer}>
                <TouchableOpacity 
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) }]}
                  onPress={() => onOpenStatusModal(goal)}
                >
                  <Text style={styles.statusText}>{getStatusText(goal.status)}</Text>
                </TouchableOpacity>

                {/* 제약 상태 (보상/제약이 있을 때만) */}
                {(goal.reward || goal.penalty) && goal.status !== GOAL_STATUS.PENDING && (
                  <TouchableOpacity 
                    style={styles.constraintBadge}
                    onPress={() => onOpenConstraintModal(goal)}
                  >
                    <Text style={styles.constraintText}>
                      {getConstraintText(goal.constraintStatus)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 액션 버튼들 */}
              <View style={styles.actionContainer}>
                {/* 타이머 버튼 */}
                {goal.status === GOAL_STATUS.PENDING && (
                  <TouchableOpacity 
                    style={styles.timerButton}
                    onPress={() => navigateToTimerScreen(goal)}
                  >
                    <Text style={styles.timerButtonText}>⏱️ 타이머</Text>
                  </TouchableOpacity>
                )}

                {/* 공유 버튼 - 선언하기 (진행중일 때) */}
                {goal.status === GOAL_STATUS.PENDING && (
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={() => handleShareDeclaration(goal)}
                  >
                    <Text style={styles.shareButtonText}>📢 선언</Text>
                  </TouchableOpacity>
                )}

                {/* 공유 버튼 - 결과 공유 (완료/실패일 때) */}
                {goal.status !== GOAL_STATUS.PENDING && (
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={() => handleShareResult(goal)}
                  >
                    <Text style={styles.shareButtonText}>📢 결과공유</Text>
                  </TouchableOpacity>
                )}

                {/* 수정 버튼 */}
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => openEditModal(goal)}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>

                {/* 삭제 버튼 */}
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteGoal(goal.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 공유 모달 */}
      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        goal={selectedGoalForShare}
        shareType={shareType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dateTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // borderLeftWidth 삭제 - 왼쪽 검정 공간 문제 해결
  },
  goalInfo: {
    marginBottom: 12,
  },
  goalTime: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 13,
    color: '#ffffff',
    marginTop: 4,
  },
  penaltyText: {
    fontSize: 13,
    color: '#ffffff',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  constraintBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.cardLight,
  },
  constraintText: {
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timerButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: COLORS.cardLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: COLORS.cardLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
  },
});

export default GoalDetailScreen;
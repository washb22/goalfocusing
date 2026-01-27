// src/screens/GoalDetailScreen.js
// 목표 상세 화면 (공유 기능 포함)

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Share } from 'react-native';
import { useGoals } from '../context/GoalContext';
import { COLORS } from '../constants/colors';
import { GOAL_STATUS, CONSTRAINT_STATUS } from '../constants/goalStatus';
import { sortGoalsByTime } from '../utils/dateUtils';

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

  const sortedGoals = sortGoalsByTime(selectedDateGoals);

  // 목표 선언 공유
  const handleShareDeclaration = async (goal) => {
    try {
      const message = `🎯 목표 선언!\n\n` +
        `📋 목표: ${goal.goal}\n` +
        `📅 날짜: ${goal.date}\n` +
        `⏰ 시간: ${goal.time}\n` +
        (goal.reward ? `🎁 보상: ${goal.reward}\n` : '') +
        (goal.penalty ? `⚠️ 제약: ${goal.penalty}\n` : '') +
        `\n#골포커싱 #목표달성`;

      await Share.share({ message });
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  // 결과 공유
  const handleShareResult = async (goal) => {
    try {
      const statusEmoji = goal.status === GOAL_STATUS.COMPLETED ? '✅' : '❌';
      const statusText = goal.status === GOAL_STATUS.COMPLETED ? '성공' : '실패';
      
      const message = `${statusEmoji} 목표 ${statusText}!\n\n` +
        `📋 목표: ${goal.goal}\n` +
        `📅 날짜: ${goal.date}\n` +
        `⏰ 시간: ${goal.time}\n` +
        `\n#골포커싱 #목표달성`;

      await Share.share({ message });
    } catch (error) {
      console.error('공유 실패:', error);
    }
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
      default: return '제약 처리';
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateToCalendarView} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'} 돌아가기</Text>
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
            <TouchableOpacity 
              key={goal.id} 
              style={styles.goalCard}
              onPress={() => navigateToTimerScreen(goal)}
              activeOpacity={0.8}
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
                  onPress={(e) => {
                    e.stopPropagation && e.stopPropagation();
                    onOpenStatusModal && onOpenStatusModal(goal);
                  }}
                >
                  <Text style={styles.statusText}>{getStatusText(goal.status)}</Text>
                </TouchableOpacity>

                {/* 제약 상태 (보상/제약이 있을 때만) */}
                {(goal.reward || goal.penalty) && (
                  <TouchableOpacity 
                    style={styles.constraintBadge}
                    onPress={(e) => {
                      e.stopPropagation && e.stopPropagation();
                      onOpenConstraintModal && onOpenConstraintModal(goal);
                    }}
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
                    onPress={(e) => {
                      e.stopPropagation && e.stopPropagation();
                      navigateToTimerScreen(goal);
                    }}
                  >
                    <Text style={styles.timerButtonText}>⏱️ 타이머</Text>
                  </TouchableOpacity>
                )}

                {/* 공유 버튼 - 선언하기 (진행중일 때) */}
                {goal.status === GOAL_STATUS.PENDING && (
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={(e) => {
                      e.stopPropagation && e.stopPropagation();
                      handleShareDeclaration(goal);
                    }}
                  >
                    <Text style={styles.shareButtonText}>📢 선언</Text>
                  </TouchableOpacity>
                )}

                {/* 공유 버튼 - 결과 공유 (완료/실패일 때) */}
                {goal.status !== GOAL_STATUS.PENDING && (
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={(e) => {
                      e.stopPropagation && e.stopPropagation();
                      handleShareResult(goal);
                    }}
                  >
                    <Text style={styles.shareButtonText}>📢 결과공유</Text>
                  </TouchableOpacity>
                )}

                {/* 수정 버튼 */}
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation && e.stopPropagation();
                    openEditModal(goal);
                  }}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>

                {/* 삭제 버튼 */}
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation && e.stopPropagation();
                    handleDeleteGoal(goal.id);
                  }}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        
        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
// src/components/ShareCard.js
// 공유용 예쁜 카드 컴포넌트

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { GOAL_STATUS } from '../constants/goalStatus';

// 목표 선언 카드
export const DeclarationCard = forwardRef(({ goal }, ref) => {
  return (
    <View ref={ref} style={styles.card}>
      <View style={styles.cardInner}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🎯</Text>
          <Text style={styles.headerText}>목표 선언!</Text>
          <Text style={styles.headerEmoji}>🎯</Text>
        </View>

        {/* 목표 내용 */}
        <View style={styles.goalContainer}>
          <Text style={styles.goalText}>"{goal.goal}"</Text>
        </View>

        {/* 날짜/시간 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoText}>{goal.date} {goal.time}</Text>
        </View>

        {/* 보상 */}
        {goal.reward && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🎁</Text>
            <Text style={styles.rewardText}>성공하면: {goal.reward}</Text>
          </View>
        )}

        {/* 제약 */}
        {goal.penalty && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⚠️</Text>
            <Text style={styles.penaltyText}>실패하면: {goal.penalty}</Text>
          </View>
        )}

        {/* 하단 메시지 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>지켜봐줘! 👀</Text>
        </View>

        {/* 앱 로고 */}
        <View style={styles.branding}>
          <Text style={styles.brandingText}>#골포커싱</Text>
        </View>
      </View>
    </View>
  );
});

// 결과 공유 카드 (성공)
export const SuccessCard = forwardRef(({ goal }, ref) => {
  return (
    <View ref={ref} style={[styles.card, styles.successCard]}>
      <View style={styles.cardInner}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🎉</Text>
          <Text style={styles.headerText}>목표 달성!</Text>
          <Text style={styles.headerEmoji}>🎉</Text>
        </View>

        {/* 목표 내용 */}
        <View style={styles.goalContainer}>
          <Text style={styles.goalText}>"{goal.goal}"</Text>
        </View>

        {/* 성공 메시지 */}
        <View style={styles.resultContainer}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successText}>성공했어요!</Text>
        </View>

        {/* 보상 */}
        {goal.reward && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🎁</Text>
            <Text style={styles.rewardText}>보상: {goal.reward}</Text>
          </View>
        )}

        {/* 앱 로고 */}
        <View style={styles.branding}>
          <Text style={styles.brandingText}>#골포커싱</Text>
        </View>
      </View>
    </View>
  );
});

// 결과 공유 카드 (실패)
export const FailureCard = forwardRef(({ goal }, ref) => {
  return (
    <View ref={ref} style={[styles.card, styles.failureCard]}>
      <View style={styles.cardInner}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>😭</Text>
          <Text style={styles.headerText}>목표 실패</Text>
          <Text style={styles.headerEmoji}>😭</Text>
        </View>

        {/* 목표 내용 */}
        <View style={styles.goalContainer}>
          <Text style={styles.goalText}>"{goal.goal}"</Text>
        </View>

        {/* 실패 메시지 */}
        <View style={styles.resultContainer}>
          <Text style={styles.failureEmoji}>❌</Text>
          <Text style={styles.failureText}>실패했습니다...</Text>
        </View>

        {/* 제약 */}
        {goal.penalty && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💸</Text>
            <Text style={styles.penaltyText}>제약: {goal.penalty}</Text>
          </View>
        )}

        {/* 하단 메시지 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>다음엔 꼭 성공할게! 💪</Text>
        </View>

        {/* 앱 로고 */}
        <View style={styles.branding}>
          <Text style={styles.brandingText}>#골포커싱</Text>
        </View>
      </View>
    </View>
  );
});

// 상태에 따라 적절한 카드 선택
export const ShareCard = forwardRef(({ goal, type = 'declaration' }, ref) => {
  if (type === 'declaration') {
    return <DeclarationCard ref={ref} goal={goal} />;
  } else if (type === 'result') {
    if (goal.status === GOAL_STATUS.COMPLETED) {
      return <SuccessCard ref={ref} goal={goal} />;
    } else {
      return <FailureCard ref={ref} goal={goal} />;
    }
  }
  return <DeclarationCard ref={ref} goal={goal} />;
});

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successCard: {
    backgroundColor: '#064e3b',
  },
  failureCard: {
    backgroundColor: '#7f1d1d',
  },
  cardInner: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 10,
  },
  goalContainer: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  goalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  rewardText: {
    fontSize: 14,
    color: '#4ade80',
  },
  penaltyText: {
    fontSize: 14,
    color: '#f87171',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  failureEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  failureText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f87171',
  },
  footer: {
    marginTop: 16,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  branding: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    width: '100%',
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
});

export default ShareCard;

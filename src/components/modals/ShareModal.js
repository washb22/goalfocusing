// src/components/modals/ShareModal.js
// 공유 옵션 선택 모달 (텍스트 공유만 - 네이티브 모듈 불필요)

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { COLORS } from '../../constants/colors';
import { GOAL_STATUS } from '../../constants/goalStatus';

// 공유 타입 상수
const SHARE_TYPE = {
  DECLARATION: 'declaration',
  RESULT: 'result',
};

// 목표 선언 텍스트 생성
const generateDeclarationText = (goal) => {
  let text = `🎯 목표 선언! 🎯\n\n`;
  text += `📌 목표: ${goal.goal}\n`;
  text += `📅 날짜: ${goal.date}\n`;
  text += `⏰ 시간: ${goal.time}까지\n\n`;
  
  if (goal.reward) {
    text += `✅ 성공하면: ${goal.reward}\n`;
  }
  if (goal.penalty) {
    text += `❌ 실패하면: ${goal.penalty}\n`;
  }
  
  text += `\n지켜봐줘! 👀\n\n#골포커싱 #목표달성 #습관형성`;
  
  return text;
};

// 결과 공유 텍스트 생성
const generateResultText = (goal) => {
  const isSuccess = goal.status === GOAL_STATUS.COMPLETED;
  
  let text = '';
  
  if (isSuccess) {
    text += `🎉 목표 달성! 🎉\n\n`;
    text += `📌 목표: ${goal.goal}\n`;
    text += `✅ 성공했어요!\n`;
    if (goal.reward) {
      text += `🎁 보상: ${goal.reward}\n`;
    }
    text += `\n오늘도 해냈다! 💪\n`;
  } else {
    text += `😭 목표 실패 😭\n\n`;
    text += `📌 목표: ${goal.goal}\n`;
    text += `❌ 실패했습니다...\n`;
    if (goal.penalty) {
      text += `💸 제약: ${goal.penalty}\n`;
    }
    text += `\n다음엔 꼭 성공할게! 💪\n`;
  }
  
  text += `\n#골포커싱 #목표달성`;
  
  return text;
};

const ShareModal = ({ 
  visible, 
  onClose, 
  goal,
  shareType = SHARE_TYPE.DECLARATION,
}) => {
  const [isSharing, setIsSharing] = useState(false);

  // 텍스트로 공유
  const handleShare = async () => {
    if (!goal) return;
    
    setIsSharing(true);
    try {
      const text = shareType === SHARE_TYPE.DECLARATION 
        ? generateDeclarationText(goal) 
        : generateResultText(goal);
      
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.error('공유 실패:', error);
    } finally {
      setIsSharing(false);
      onClose();
    }
  };

  const getTitle = () => {
    return shareType === SHARE_TYPE.DECLARATION 
      ? '📢 친구에게 선언하기' 
      : '📢 결과 공유하기';
  };

  const getDescription = () => {
    return shareType === SHARE_TYPE.DECLARATION
      ? '목표를 친구에게 공표하면\n달성률이 올라가요! 💪'
      : '결과를 친구에게 공유해보세요!';
  };

  const getPreviewText = () => {
    if (!goal) return '';
    return shareType === SHARE_TYPE.DECLARATION 
      ? generateDeclarationText(goal) 
      : generateResultText(goal);
  };

  if (!goal) return null;

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* 제목 */}
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.description}>{getDescription()}</Text>

          {/* 미리보기 */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>미리보기</Text>
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>{getPreviewText()}</Text>
            </View>
          </View>

          {/* 공유 버튼 */}
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.shareButtonText}>📤 공유하기</Text>
            )}
          </TouchableOpacity>

          {/* 취소 버튼 */}
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
            disabled={isSharing}
          >
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: '85%',
    maxWidth: 340,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  previewContainer: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  previewBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
  },
  previewText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});

export { SHARE_TYPE };
export default ShareModal;

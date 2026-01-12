// src/components/modals/ShareModal.js
// 공유 옵션 선택 모달

import React, { useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';
import { ShareCard } from '../ShareCard';
import { shareAsText, shareAsImage, SHARE_TYPE } from '../../utils/shareUtils';

const ShareModal = ({ 
  visible, 
  onClose, 
  goal,
  shareType = SHARE_TYPE.DECLARATION, // 'declaration' 또는 'result'
}) => {
  const cardRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showCard, setShowCard] = useState(false);

  // 텍스트로 공유
  const handleTextShare = async () => {
    setIsSharing(true);
    await shareAsText(goal, shareType);
    setIsSharing(false);
    onClose();
  };

  // 이미지로 공유
  const handleImageShare = async () => {
    setShowCard(true);
    setIsSharing(true);
    
    // 카드가 렌더링될 때까지 잠시 대기
    setTimeout(async () => {
      if (cardRef.current) {
        await shareAsImage(cardRef);
      }
      setIsSharing(false);
      setShowCard(false);
      onClose();
    }, 500);
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

          {/* 공유 옵션들 */}
          <View style={styles.optionsContainer}>
            {/* 텍스트로 공유 */}
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleTextShare}
              disabled={isSharing}
            >
              <Text style={styles.optionIcon}>📝</Text>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>텍스트로 공유</Text>
                <Text style={styles.optionDesc}>카카오톡, 문자 등</Text>
              </View>
            </TouchableOpacity>

            {/* 이미지로 공유 */}
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleImageShare}
              disabled={isSharing}
            >
              <Text style={styles.optionIcon}>🖼️</Text>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>이미지 카드로 공유</Text>
                <Text style={styles.optionDesc}>인스타 스토리, SNS 등</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 로딩 표시 */}
          {isSharing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>준비 중...</Text>
            </View>
          )}

          {/* 취소 버튼 */}
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
            disabled={isSharing}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        </View>

        {/* 숨겨진 카드 (이미지 캡처용) */}
        {showCard && (
          <View style={styles.hiddenCardContainer}>
            <ShareCard 
              ref={cardRef} 
              goal={goal} 
              type={shareType}
            />
          </View>
        )}
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
    marginBottom: 24,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginLeft: 8,
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
  hiddenCardContainer: {
    position: 'absolute',
    top: -1000,
    left: 0,
  },
});

export default ShareModal;

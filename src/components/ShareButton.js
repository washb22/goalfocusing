// src/components/ShareButton.js
// 공유 버튼 컴포넌트

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const ShareButton = ({ 
  onPress, 
  type = 'declaration', // 'declaration' | 'result'
  style,
}) => {
  const getButtonText = () => {
    return type === 'declaration' 
      ? '📢 친구에게 선언하기' 
      : '📢 결과 공유하기';
  };

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>{getButtonText()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShareButton;

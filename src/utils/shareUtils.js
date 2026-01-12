// src/utils/shareUtils.js
// 공유 기능 유틸리티

import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { GOAL_STATUS } from '../constants/goalStatus';

/**
 * 목표 선언 텍스트 생성
 */
export const generateDeclarationText = (goal) => {
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

/**
 * 결과 공유 텍스트 생성
 */
export const generateResultText = (goal) => {
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

/**
 * 텍스트로 공유
 */
export const shareAsText = async (goal, type = 'declaration') => {
  try {
    const text = type === 'declaration' 
      ? generateDeclarationText(goal) 
      : generateResultText(goal);
    
    const result = await Share.share({
      message: text,
    });
    
    if (result.action === Share.sharedAction) {
      console.log('공유 성공');
      return true;
    }
    return false;
  } catch (error) {
    console.error('텍스트 공유 실패:', error);
    return false;
  }
};

/**
 * 이미지 카드로 공유
 */
export const shareAsImage = async (cardRef) => {
  try {
    // 카드를 이미지로 캡처
    const uri = await captureRef(cardRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    
    console.log('이미지 캡처 완료:', uri);
    
    // 공유 가능한지 확인
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: '목표 공유하기',
        UTI: 'public.png',
      });
      console.log('이미지 공유 성공');
      return true;
    } else {
      console.log('공유 기능을 사용할 수 없습니다');
      return false;
    }
  } catch (error) {
    console.error('이미지 공유 실패:', error);
    return false;
  }
};

/**
 * 공유 타입 상수
 */
export const SHARE_TYPE = {
  DECLARATION: 'declaration',  // 목표 선언
  RESULT: 'result',           // 결과 공유
};

export default {
  generateDeclarationText,
  generateResultText,
  shareAsText,
  shareAsImage,
  SHARE_TYPE,
};

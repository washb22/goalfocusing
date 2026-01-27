// src/constants/goalStatus.js
// 목표 상태 상수 정의

export const GOAL_STATUS = {
  PENDING: 'pending',       // 미완료/진행중
  COMPLETED: 'completed',   // 완료됨
  FAILED: 'failed',         // 실패
};

export const CONSTRAINT_STATUS = {
  NONE: null,               // 미선택
  KEPT: 'kept',             // 제약 지킴 (추가됨)
  BROKEN: 'broken',         // 제약 못지킴 (추가됨)
  // 하위 호환성을 위해 기존 값도 유지
  COMPLETED: 'completed',   
  FAILED: 'failed',
};
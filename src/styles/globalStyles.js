// src/styles/globalStyles.js
// 앱 전체에서 사용하는 공통 스타일

import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS } from '../constants/colors';

export const globalStyles = StyleSheet.create({
  // 컨테이너
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // 타이틀
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // 입력 필드
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputText: {
    color: COLORS.textDisabled,
    textAlign: 'center',
  },
  selectedText: {
    color: COLORS.textPrimary,
  },
  
  // 버튼
  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  button: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    padding: 16,
    zIndex: 1100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: COLORS.card,
  },
  confirmButton: {
    backgroundColor: COLORS.primaryDark,
  },
  modalButtonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  
  // 상태 버튼
  completedButton: {
    backgroundColor: COLORS.success,
  },
  pendingButton: {
    backgroundColor: COLORS.cardLight,
  },
  failedButton: {
    backgroundColor: COLORS.error,
  },
  constraintButton: {
    backgroundColor: COLORS.info,
  },
  statusButtonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  
  // 탭 바
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundDark,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    alignItems: 'stretch',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    height: '100%',
  },
  activeTab: {
    backgroundColor: 'rgba(76, 29, 149, 0.1)',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
});

// 달력 스타일
export const calendarStyles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  navButton: {
    fontSize: 24,
    color: COLORS.textPrimary,
    padding: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayText: {
    color: COLORS.textPrimary,
  },
  outOfMonthDayText: {
    color: COLORS.textMuted,
  },
  selectedDay: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 999,
  },
  selectedDayText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginTop: 4,
  },
});

// 목표 상세 스타일
export const detailStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  cardReward: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 4,
  },
  cardPenalty: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
});

// 시간 선택기 스타일
export const timePickerStyles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wheelContainer: {
    flexDirection: 'row',
    height: 200,
  },
  scrollView: {
    width: 60,
    height: 200,
  },
  scrollContent: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  item: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  itemText: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  selectedItemText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  separator: {
    fontSize: 30,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginHorizontal: 5,
  },
  ampmColumn: {
    marginLeft: 15,
    justifyContent: 'center',
  },
  ampmButton: {
    width: 70,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 8,
  },
  ampmText: {
    color: COLORS.textMuted,
    fontSize: 22,
  },
  selectedAmPm: {
    backgroundColor: COLORS.primaryDark,
  },
  selectedAmPmText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

export default globalStyles;

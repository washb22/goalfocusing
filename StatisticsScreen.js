// StatisticsScreen.js - 하단 여백 최적화
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import dayjs from 'dayjs';
// Google Mobile Ads 추가
import { InterstitialAd, AdEventType, BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export default function StatisticsScreen() {
  // 화면 크기 가져오기
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const getProgressBarColor = (rate) => {
    if (rate >= 81) return '#22c55e';
    if (rate >= 61) return '#86efac';
    if (rate >= 41) return '#facc15';
    if (rate >= 21) return '#fb923c';
    if (rate >= 1) return '#ef4444';
    return '#334155';
  };

  const [savedGoals, setSavedGoals] = useState([]);
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0, failed: 0, rate: 0 });
  const [weeklyStats, setWeeklyStats] = useState({ rate: 0, dailyRates: [] });
  const [constraintStats, setConstraintStats] = useState({ rate: 0, dailyRates: [] });

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 6)));
  const [endDate, setEndDate] = useState(new Date());

  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);

  const [selectedRange, setSelectedRange] = useState('7일');
  const [selectedTab, setSelectedTab] = useState('goal');

  // 광고 관련 상태
  const [adError, setAdError] = useState(false);

  // 대목표 관련 상태
  const [bigGoal, setBigGoal] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showBigGoalEditModal, setShowBigGoalEditModal] = useState(false);
  const [newBigGoalTitle, setNewBigGoalTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);

  // 광고 ID (개발용 테스트 ID)
  const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-3077862428685229/9380705536';

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const formatDate = (date) => date.toISOString().split('T')[0];

  // 대목표 남은 일수 계산 함수
  const calculateDaysRemaining = (targetDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 부분 제거

    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0); // 시간 부분 제거

    const timeDiff = targetDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    setDaysRemaining(daysDiff > 0 ? daysDiff : 0);
  };

  // 대목표 불러오기
  const loadBigGoal = async () => {
    try {
      const savedBigGoal = await AsyncStorage.getItem('bigGoal');
      if (savedBigGoal) {
        const parsedBigGoal = JSON.parse(savedBigGoal);
        setBigGoal(parsedBigGoal);
        calculateDaysRemaining(parsedBigGoal.targetDate);
      }
    } catch (error) {
      console.error('골포커싱 불러오기 실패:', error);
    }
  };

  // 대목표 저장
  const saveBigGoal = async () => {
    if (!newBigGoalTitle.trim() || !newTargetDate) {
      alert('목표 이름과 목표일을 모두 입력해주세요');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newBigGoal = {
      title: newBigGoalTitle,
      startDate: today,
      targetDate: newTargetDate,
    };

    try {
      await AsyncStorage.setItem('bigGoal', JSON.stringify(newBigGoal));
      setBigGoal(newBigGoal);
      calculateDaysRemaining(newTargetDate);
      setShowBigGoalEditModal(false);

      // 입력 필드 초기화
      setNewBigGoalTitle('');
      setNewTargetDate('');
    } catch (error) {
      console.error('골포커싱 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다');
    }
  };

  // 대목표 삭제 함수 추가
  const deleteBigGoal = async () => {
    try {
      // 삭제 확인
      Alert.alert(
        "골포커싱 삭제",
        "이 목표를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "삭제",
            style: "destructive",
            onPress: async () => {
              // AsyncStorage에서 데이터 삭제
              await AsyncStorage.removeItem('bigGoal');
              // 상태 초기화
              setBigGoal(null);
              setDaysRemaining(0);
              // 성공 메시지
              Alert.alert("삭제 완료", "골포커싱이 성공적으로 삭제되었습니다.");
            }
          }
        ]
      );
    } catch (error) {
      console.error('골포커싱 삭제 실패:', error);
      Alert.alert("오류", "목표 삭제 중 문제가 발생했습니다.");
    }
  };

  // 목표일 선택기 핸들러
  const handleTargetDateConfirm = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setNewTargetDate(formattedDate);
    setShowTargetDatePicker(false);
  };

  const calculateTodayStats = (goals) => {
    const today = getTodayString();
    const todayGoals = goals.filter(goal => goal.date === today);
    const total = todayGoals.length;
    const completed = todayGoals.filter(g => g.status === 'completed').length;
    const failed = todayGoals.filter(g => g.status === 'failed').length;
    const rate = total > 0 ? Math.floor((completed / total) * 100) : 0;
    return { total, completed, failed, rate };
  };

  const calculateStatsBetween = (goals, fromDate, toDate, type = 'goal') => {
    const dayMap = new Array(7).fill(0);
    const successMap = new Array(7).fill(0);
    let totalCount = 0;
    let totalSuccess = 0;

    const date = new Date(fromDate);
    while (date <= toDate) {
      const copy = new Date(date);
      const dateStr = formatDate(copy);
      const dayIndex = copy.getDay();

      const dayGoals = goals.filter(goal => goal.date === dateStr);
      let filtered = [];
      if (type === 'goal') {
        filtered = dayGoals.filter(g => g.status);
        totalCount += filtered.length;
        const completed = filtered.filter(g => g.status === 'completed').length;
        successMap[dayIndex] += completed;
        dayMap[dayIndex] += filtered.length;
        totalSuccess += completed;
      } else {
        filtered = dayGoals.filter(g => g.constraintStatus);
        totalCount += filtered.length;
        const completed = filtered.filter(g => g.constraintStatus === 'completed').length;
        successMap[dayIndex] += completed;
        dayMap[dayIndex] += filtered.length;
        totalSuccess += completed;
      }
      date.setDate(date.getDate() + 1);
    }

    const dailyRates = dayMap.map((total, i) => total > 0 ? Math.floor((successMap[i] / total) * 100) : 0);
    const rate = totalCount > 0 ? Math.floor((totalSuccess / totalCount) * 100) : 0;
    return { rate, dailyRates };
  };

  const loadGoals = async () => {
    const json = await AsyncStorage.getItem('savedGoals');
    const goals = JSON.parse(json || '[]');
    setSavedGoals(goals);
    setTodayStats(calculateTodayStats(goals));
    setWeeklyStats(calculateStatsBetween(goals, startDate, endDate, 'goal'));
    setConstraintStats(calculateStatsBetween(goals, startDate, endDate, 'constraint'));
  };


  const getRateColor = (rate) => {
    if (rate >= 80) return '#4ade80';   // 초록 (80~100%)
    if (rate >= 60) return '#86efac';   // 연두 (60~79%)
    if (rate >= 40) return '#facc15';   // 주황 (40~59%)
    if (rate >= 20) return '#fb923c';   // 진주황 (20~39%)
    if (rate >= 1)  return '#ef4444';   // 빨강 (1~19%)
    return '#334155';                  // 0%일 경우 회색 (선택)
  };

  const getRateMessage = (rate) => {
    if (rate >= 81) return '이 정도면 어플 없어도 됩니다.';
    if (rate >= 61) return '제약까지 걸어놓고 이것밖에 못했다고?';
    if (rate >= 41) return '이도 저도 아닌 상태. 제약 걸 땐 끝까지 지켜야지.';
    if (rate >= 21) return '의지가 약한 거야. 핑계 말고 행동해.';
    if (rate >= 1)  return '시작은 했다.';
    return '말로만 각오했네. 제약 걸 땐 지켜야지.';
  };

  const getConstraintMessage = (rate) => {
    if (rate >= 81) return '다음번엔 제약이 필요없기를';
    if (rate >= 61) return '목표도 못지키고 제약도 못지키고';
    if (rate >= 41) return '▲▲ 내가 지금 이상태인 이유';
    if (rate >= 21) return '이럴거면 제약걸지 맙시다.';
    if (rate >= 1)  return '미안해요. 목표달성 힘들거에요.';
    return '말로만 각오했네. 제약 걸 땐 지켜야지.';
  };

  useEffect(() => {
    loadGoals();
    loadBigGoal(); // 대목표 데이터 로드
    showAdOncePerDay(); // 통계 진입 시 1일 1회 광고
  }, [startDate, endDate]);

  const handleRangeSelect = (range) => {
    const today = new Date();
    let start;
    if (range === '7일') {
      start = new Date(today.setDate(today.getDate() - 6));
    } else if (range === '30일') {
      start = new Date(today.setDate(today.getDate() - 29));
    } else {
      return;
    }
    setStartDate(start);
    setEndDate(new Date());
    setSelectedRange(range);
  };


const interstitialAdUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-3077862428685229/9380705536'; // 실제 광고 ID

const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const showAdOncePerDay = async () => {
  const today = dayjs().format('YYYY-MM-DD');
  const lastShown = await AsyncStorage.getItem('lastAdDate');

  if (lastShown === today) {
    return; // 오늘 이미 광고 본 경우
  }

  const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, async () => {
    await AsyncStorage.setItem('lastAdDate', today);
    unsubscribeClosed();
  });

  const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (err) => {
    console.log('전면 광고 오류:', err);
    unsubscribeClosed();
  });

  interstitial.load();
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitial.show();
  });
};



  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
  const currentStats = selectedTab === 'goal' ? weeklyStats : constraintStats;

  const toggleTabLeft = () => {
    setSelectedTab(prev => (prev === 'constraint' ? 'goal' : 'constraint'));
  };
  const toggleTabRight = () => {
    setSelectedTab(prev => (prev === 'goal' ? 'constraint' : 'goal'));
  };

  // 대목표 편집 모달 열기
  const openBigGoalModal = () => {
    // 기존 대목표가 있으면 해당 값으로 초기화
    if (bigGoal) {
      setNewBigGoalTitle(bigGoal.title);
      setNewTargetDate(bigGoal.targetDate);
    } else {
      setNewBigGoalTitle('');
      setNewTargetDate('');
    }
    setShowBigGoalEditModal(true);
  };

  // 골포커싱 컴포넌트
  const BigGoalComponent = () => {
    // 대목표가 없는 경우
    if (!bigGoal) {
      return (
        <TouchableOpacity style={styles.bigGoalEmptyCard} onPress={openBigGoalModal}>
          <Text style={styles.bigGoalEmptyText}>골포커싱 설정하기</Text>
          <Text style={styles.bigGoalEmptySubtext}>장기적인 목표를 설정하고 미친듯이 노력하세요</Text>
        </TouchableOpacity>
      );
    }

    // 대목표가 있는 경우
    return (
      <View style={styles.bigGoalCard}>
        <View style={styles.bigGoalHeader}>
          <Text style={styles.bigGoalTitle}>나의 골포커싱</Text>
          <View style={styles.bigGoalHeaderButtons}>
            <TouchableOpacity style={styles.bigGoalEditButton} onPress={openBigGoalModal}>
              <Text style={styles.bigGoalEditText}>편집</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bigGoalDeleteButton} onPress={deleteBigGoal}>
              <Text style={styles.bigGoalDeleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.bigGoalText}>{bigGoal.title}</Text>

        <View style={styles.bigGoalCountdown}>
          <Text style={styles.bigGoalDaysLabel}>목표일까지</Text>
          <View style={styles.bigGoalDaysContainer}>
            <Text style={styles.bigGoalDaysNumber}>{daysRemaining}</Text>
            <Text style={styles.bigGoalDaysText}>일 남았습니다</Text>
          </View>
        </View>

        <View style={styles.bigGoalDateRow}>
          <View style={styles.bigGoalDateItem}>
            <Text style={styles.bigGoalDateLabel}>시작일</Text>
            <Text style={styles.bigGoalDateValue}>
              {bigGoal.startDate || '미설정'}
            </Text>
          </View>

          <View style={styles.bigGoalDateDivider} />

          <View style={styles.bigGoalDateItem}>
            <Text style={styles.bigGoalDateLabel}>목표일</Text>
            <Text style={styles.bigGoalDateValue}>
              {bigGoal.targetDate || '미설정'}
            </Text>
          </View>
        </View>

        {/* 모티베이션 메시지 */}
        <Text style={styles.bigGoalMotivationText}>
          {daysRemaining > 30
            ? '난 할 수 있다.'
            : daysRemaining > 7
              ? '목표 달성이 가까워지고 있어요!'
              : '마지막 스퍼트! 할 수 있어요!'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 스크롤 가능한 컨테이너로 감싸기 */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        overScrollMode="always"
      >
        <View style={styles.rangeSelector}>
          {['7일', '30일', '전체 기간'].map(label => (
            <TouchableOpacity
              key={label}
              style={[styles.rangeButton, selectedRange === label && styles.rangeButtonActive]}
              onPress={() => {
                if (label === '전체 기간') {
                  setSelectedRange(label);
                } else {
                  handleRangeSelect(label);
                }
              }}
            >
              <Text style={[styles.rangeButtonText, selectedRange === label && styles.rangeButtonTextActive]}>
                {label === '전체 기간' ? '전체 기간' : `최근 ${label}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setStartPickerVisible(true)}>
            <Text style={styles.dateInput}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 18 }}>~</Text>
          <TouchableOpacity onPress={() => setEndPickerVisible(true)}>
            <Text style={styles.dateInput}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* 오늘의 목표 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>오늘의 목표</Text>
          <Text style={styles.mainNumber}>{todayStats.total}개의 목표</Text>
          <View style={styles.progressBarWrapper}>
            <View style={[styles.progressBar, {
              width: `${todayStats.rate}%`,
              backgroundColor: getProgressBarColor(todayStats.rate)
            }]} />
          </View>
          <View style={styles.goalSummaryRow}>
            <Text style={styles.goalLabel}>완료 {todayStats.completed}</Text>
            <Text style={styles.goalLabel}>실패 {todayStats.failed}</Text>
            <Text style={styles.goalPercent}>{todayStats.rate}%</Text>
          </View>
        </View>

        {/* 대목표 컴포넌트 - 오늘의 목표와 기간 목표 성공률 사이에 배치 */}
        <BigGoalComponent />

        {/* 기간 목표 성공률 헤더 + 퍼센티지 + 그래프 */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>
              {selectedTab === 'goal' ? '기간 목표 성공률' : '기간 제약 이행률'}
            </Text>
            <View style={styles.inlineSwitch}>
              <TouchableOpacity onPress={toggleTabLeft}>
                <Text style={styles.arrow}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.tabLabel}>
                {selectedTab === 'goal' ? '목표' : '제약'}
              </Text>
              <TouchableOpacity onPress={toggleTabRight}>
                <Text style={styles.arrow}>{'>'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 퍼센티지 텍스트 */}
          <Text style={[styles.percentLabel, { color: getRateColor(currentStats.rate) }]}>
            {currentStats.rate}%
          </Text>

          {selectedTab === 'goal' && (
            <Text style={styles.percentMessage}>
              {getRateMessage(currentStats.rate)}
            </Text>
          )}

          {selectedTab === 'constraint' && (
            <Text style={styles.percentMessage}>
              {getConstraintMessage(currentStats.rate)}
            </Text>
          )}

          {/* 바 그래프 */}
          <View style={styles.weekChart}>
            {currentStats.dailyRates.map((rate, i) => (
              <View key={i} style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, {
                  height: Math.max(8, Math.min(rate, 100)),
                  backgroundColor: '#22c55e'
                }]} />
                <Text style={styles.chartLabel}>{dayLabels[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 표준 배너 광고 (320x50) */}
        <View style={styles.standardBannerContainer}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.BANNER} // BANNER는 320x50 표준 크기
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdFailedToLoad={(error) => {
              console.log('광고 로드 실패:', error);
              setAdError(true);
            }}
          />
        </View>

        {/* 하단 여백을 최소화 - 더 이상 더 많은 페이딩 영역이 보이지 않도록 함 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 날짜 선택기 모달 */}
      <DateTimePickerModal
        isVisible={isStartPickerVisible}
        mode="date"
        date={startDate}
        onConfirm={(date) => {
          setStartDate(date);
          setSelectedRange('전체 기간');
          setStartPickerVisible(false);
        }}
        onCancel={() => setStartPickerVisible(false)}
      />
      <DateTimePickerModal
        isVisible={isEndPickerVisible}
        mode="date"
        date={endDate}
        onConfirm={(date) => {
          setEndDate(date);
          setSelectedRange('전체 기간');
          setEndPickerVisible(false);
        }}
        onCancel={() => setEndPickerVisible(false)}
      />

      {/* 대목표 수정 모달 */}
      <Modal
        visible={showBigGoalEditModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>골포커싱 설정</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>목표 이름</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="골포커싱을 입력하세요 (예: 한달-10kg감량)"
                placeholderTextColor="#94a3b8"
                value={newBigGoalTitle}
                onChangeText={setNewBigGoalTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>목표 달성일</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowTargetDatePicker(true)}
              >
                <Text style={newTargetDate ? styles.dateInputText : styles.dateInputPlaceholder}>
                  {newTargetDate || "목표 달성일을 선택하세요"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalTipContainer}>
              <Text style={styles.modalTipTitle}>💡 설정 팁</Text>
              <Text style={styles.modalTipText}>
                구체적인 날짜를 설정하면 목표 달성에 더 도움이 됩니다.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowBigGoalEditModal(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  (!newBigGoalTitle || !newTargetDate) && styles.modalConfirmDisabled
                ]}
                onPress={saveBigGoal}
                disabled={!newBigGoalTitle || !newTargetDate}
              >
                <Text style={styles.modalConfirmText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <DateTimePickerModal
          isVisible={showTargetDatePicker}
          mode="date"
          date={newTargetDate ? new Date(newTargetDate) : new Date()}
          minimumDate={new Date()} // 오늘 이후만 선택 가능
          onConfirm={handleTargetDateConfirm}
          onCancel={() => setShowTargetDatePicker(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    // paddingBottom은 제거하고 대신 bottomSpacing 컴포넌트를 사용
  },
  // 하단 여백 최적화 - 높이를 크게 줄임
  bottomSpacing: {
    height: 20, // 100에서 20으로 크게 줄임으로써 빈 공간 최소화
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  sectionTitle: { fontSize: 16, color: '#cbd5e1', fontWeight: 'bold' },
  mainNumber: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginVertical: 8 },
  progressBarWrapper: { backgroundColor: '#334155', height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBar: { backgroundColor: '#22c55e', height: '100%' },
  goalSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  goalLabel: { color: '#94a3b8', fontSize: 14 },
  goalPercent: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'flex-end',
  },
  chartBarWrapper: { alignItems: 'center', flex: 1 },
  chartBar: { width: 14, borderRadius: 6, marginBottom: 6 },
  chartLabel: { fontSize: 12, color: '#94a3b8' },
  rangeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  rangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#334155',
  },
  rangeButtonActive: { backgroundColor: '#4ade80' },
  rangeButtonText: { color: '#cbd5e1', fontWeight: 'bold' },
  rangeButtonTextActive: { color: '#1e293b' },
  dateInput: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    color: 'white',
    borderRadius: 8,
    fontSize: 16,
  },
  arrowHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4
  },
  arrow: {
    color: '#ffffff',
    fontSize: 18,
    paddingHorizontal: 10
  },
  arrowTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cbd5e1'
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1
  },
  inlineSwitch: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  percentMessage: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'left',
    alignSelf: 'flex-start'
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  percentLabel: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8
  },

  // 표준 배너 광고 컨테이너 (320x50)
  standardBannerContainer: {
    width: '100%',
    height: 50, // 표준 배너 높이
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30, // 하단 여백 약간 추가
  },

  // 대목표 카드 - 비어있을 때
  bigGoalEmptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  bigGoalEmptyText: {
    color: '#8b5cf6',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bigGoalEmptySubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },

  // 대목표 카드 - 있을 때
  bigGoalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bigGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bigGoalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigGoalTitle: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bigGoalEditButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bigGoalEditText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bigGoalDeleteButton: {
    backgroundColor: '#ef4444', // 빨간색 배경
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  bigGoalDeleteText: {
    color: '#ffffff', // 흰색 텍스트
    fontSize: 12,
    fontWeight: 'bold',
  },
  bigGoalText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bigGoalCountdown: {
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 12,
  },
  bigGoalDaysLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  bigGoalDaysContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigGoalDaysNumber: {
    color: '#8b5cf6',
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 4,
  },
  bigGoalDaysText: {
    color: '#ffffff',
    fontSize: 16,
  },
  bigGoalDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  bigGoalDateItem: {
    flex: 1,
    alignItems: 'center',
  },
  bigGoalDateDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  bigGoalDateLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  bigGoalDateValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bigGoalMotivationText: {
    color: '#8b5cf6',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#334155',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dateInputText: {
    color: '#ffffff',
    fontSize: 16,
  },
  dateInputPlaceholder: {
    color: '#94a3b8',
    fontSize: 16,
  },
  modalTipContainer: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  modalTipTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalTipText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmDisabled: {
    backgroundColor: '#4c1d95',
    opacity: 0.5,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
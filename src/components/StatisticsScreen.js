import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const StatisticsScreen = () => {
  const [todayGoals, setTodayGoals] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);
  const [completedGoals, setCompletedGoals] = useState(0);
  const [incompleteGoals, setIncompleteGoals] = useState(0);
  const [weeklySuccessRate, setWeeklySuccessRate] = useState(0);
  const [failedGoals, setFailedGoals] = useState([]);
  const [goalStatusRatio, setGoalStatusRatio] = useState({
    success: 0,
    failure: 0,
    constraintCompleted: 0,
    incomplete: 0
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const goalsData = await AsyncStorage.getItem('savedGoals');
      if (goalsData) {
        const goals = JSON.parse(goalsData);
        
        // 오늘의 목표 개수
        const today = new Date().toISOString().split('T')[0];
        const todayGoalsCount = goals.filter(goal => 
          goal.createdAt.split('T')[0] === today
        ).length;
        setTodayGoals(todayGoalsCount);

        // 전체 통계
        setTotalGoals(goals.length);
        const completed = goals.filter(goal => goal.status === 'completed').length;
        const incomplete = goals.filter(goal => goal.status === 'incomplete').length;
        setCompletedGoals(completed);
        setIncompleteGoals(incomplete);

        // 주간 성공률
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const weeklyGoals = goals.filter(goal => 
          new Date(goal.createdAt) >= lastWeek
        );
        const weeklyCompleted = weeklyGoals.filter(goal => 
          goal.status === 'completed'
        ).length;
        setWeeklySuccessRate(
          weeklyGoals.length > 0 
            ? (weeklyCompleted / weeklyGoals.length) * 100 
            : 0
        );

        // 실패한 목표 목록
        const failed = goals
          .filter(goal => goal.status === 'failed')
          .map(goal => ({
            date: goal.createdAt.split('T')[0],
            title: goal.goal
          }));
        setFailedGoals(failed);

        // 목표 상태 비율
        const statusCounts = {
          success: goals.filter(goal => goal.status === 'completed').length,
          failure: goals.filter(goal => goal.status === 'failed').length,
          constraintCompleted: goals.filter(goal => goal.status === 'constraint_completed').length,
          incomplete: goals.filter(goal => goal.status === 'incomplete').length
        };
        setGoalStatusRatio(statusCounts);
      }
    } catch (error) {
      console.error('통계 로딩 중 오류 발생:', error);
    }
  };

  const pieChartData = [
    {
      name: '성공',
      population: goalStatusRatio.success,
      color: '#4CAF50',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: '실패',
      population: goalStatusRatio.failure,
      color: '#F44336',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: '제약완료',
      population: goalStatusRatio.constraintCompleted,
      color: '#FFC107',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: '미완료',
      population: goalStatusRatio.incomplete,
      color: '#9E9E9E',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>오늘의 목표 현황</Text>
        <Text style={styles.statText}>오늘의 목표 개수: {todayGoals}개</Text>
        <Text style={styles.statText}>총 목표 수: {totalGoals}개</Text>
        <Text style={styles.statText}>완료: {completedGoals}개</Text>
        <Text style={styles.statText}>미완료: {incompleteGoals}개</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>주간 성공률</Text>
        <Text style={styles.statText}>{weeklySuccessRate.toFixed(1)}%</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>실패한 목표 목록</Text>
        {failedGoals.map((goal, index) => (
          <Text key={index} style={styles.failedGoalText}>
            {goal.date} - {goal.title}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>목표 상태 비율</Text>
        <PieChart
          data={pieChartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  failedGoalText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});

export default StatisticsScreen; 
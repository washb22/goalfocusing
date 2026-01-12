// src/screens/GoalInputScreen.js
// 목표 입력 화면

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { useGoals } from '../context/GoalContext';
import { globalStyles } from '../styles/globalStyles';

const GoalInputScreen = ({ openInputModal, setShowDateModal, setShowTimeModal }) => {
  const { 
    goal, 
    goalDate, 
    goalTime, 
    reward, 
    penalty, 
    saveGoal 
  } = useGoals();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  return (
    <Animated.View style={[globalStyles.content, { opacity: fadeAnim }]}>
      <View style={globalStyles.titleContainer}>
        <Text style={globalStyles.titleText}>목표 설정하기</Text>
        <Text style={globalStyles.subtitleText}>작은 목표부터 하나씩</Text>
      </View>

      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>달성목표</Text>
        <TouchableOpacity onPress={() => openInputModal('goal')}>
          <View style={globalStyles.input}>
            <Text style={[globalStyles.inputText, goal ? globalStyles.selectedText : {}]}>
              {goal || "목표를 입력하세요"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>목표 날짜</Text>
        <TouchableOpacity onPress={() => setShowDateModal(true)}>
          <View style={globalStyles.input}>
            <Text style={[globalStyles.inputText, goalDate ? globalStyles.selectedText : {}]}>
              {goalDate || "날짜를 선택하세요"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>목표 시간</Text>
        <TouchableOpacity onPress={() => setShowTimeModal(true)}>
          <View style={globalStyles.input}>
            <Text style={[globalStyles.inputText, goalTime ? globalStyles.selectedText : {}]}>
              {goalTime || "시간을 선택하세요"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>성공 보상</Text>
        <TouchableOpacity onPress={() => openInputModal('reward')}>
          <View style={globalStyles.input}>
            <Text style={[globalStyles.inputText, reward ? globalStyles.selectedText : {}]}>
              {reward || "보상을 입력하세요"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.inputContainer}>
        <Text style={globalStyles.label}>실패 제약</Text>
        <TouchableOpacity onPress={() => openInputModal('penalty')}>
          <View style={globalStyles.input}>
            <Text style={[globalStyles.inputText, penalty ? globalStyles.selectedText : {}]}>
              {penalty || "제약을 입력하세요"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.buttonContainer}>
        <TouchableOpacity style={globalStyles.button} onPress={saveGoal}>
          <Text style={globalStyles.buttonText}>저장하기</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default GoalInputScreen;

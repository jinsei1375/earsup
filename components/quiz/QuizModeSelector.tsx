// components/quiz/QuizModeSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface QuizModeSelectorProps {
  selectedMode: 'all-at-once-host' | 'all-at-once-auto';
  onModeChange: (mode: 'all-at-once-host' | 'all-at-once-auto') => void;
  quizInputType: 'sentence' | 'word_separate';
  onQuizInputTypeChange: (type: 'sentence' | 'word_separate') => void;
  allowPartialPoints: boolean;
  onPartialPointsChange: (allow: boolean) => void;
  maxReplayCount: number;
  onMaxReplayCountChange: (count: number) => void;
  disabled?: boolean;
}

export const QuizModeSelector: React.FC<QuizModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  quizInputType,
  onQuizInputTypeChange,
  allowPartialPoints,
  onPartialPointsChange,
  maxReplayCount,
  onMaxReplayCountChange,
  disabled = false,
}) => {
  return (
    <View className="w-full mb-6">
      {/* クイズモード選択 */}
      <Text className="mb-2 font-bold">クイズモード</Text>
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() => onModeChange('all-at-once-host')}
          disabled={disabled}
          className={`flex-1 mr-2 p-4 rounded-lg border-2 items-center justify-center ${
            selectedMode === 'all-at-once-host'
              ? 'bg-app-primary border-app-primary'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              selectedMode === 'all-at-once-host' ? 'text-white' : 'text-gray-700'
            }`}
          >
            ホストあり
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              selectedMode === 'all-at-once-host' ? 'text-white' : 'text-gray-500'
            }`}
          >
            ホストが問題を作成・判定
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onModeChange('all-at-once-auto')}
          disabled={disabled}
          className={`flex-1 ml-2 p-4 rounded-lg border-2 items-center justify-center ${
            selectedMode === 'all-at-once-auto'
              ? 'bg-app-primary border-app-primary'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              selectedMode === 'all-at-once-auto' ? 'text-white' : 'text-gray-700'
            }`}
          >
            ホストなし
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              selectedMode === 'all-at-once-auto' ? 'text-white' : 'text-gray-500'
            }`}
          >
            自動クイズ・自動判定
          </Text>
        </TouchableOpacity>
      </View>

      {/* 入力タイプ選択 */}
      <Text className="mb-2 font-bold">回答入力方式</Text>
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() => onQuizInputTypeChange('sentence')}
          disabled={disabled}
          className={`flex-1 mr-2 p-4 rounded-lg border-2 items-center justify-center ${
            quizInputType === 'sentence'
              ? 'bg-app-primary border-app-primary'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              quizInputType === 'sentence' ? 'text-white' : 'text-gray-700'
            }`}
          >
            文章入力
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              quizInputType === 'sentence' ? 'text-white' : 'text-gray-500'
            }`}
          >
            従来の文章全体入力
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onQuizInputTypeChange('word_separate')}
          disabled={disabled}
          className={`flex-1 ml-2 p-4 rounded-lg border-2 items-center justify-center ${
            quizInputType === 'word_separate'
              ? 'bg-app-primary border-app-primary'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              quizInputType === 'word_separate' ? 'text-white' : 'text-gray-700'
            }`}
          >
            単語区切り
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              quizInputType === 'word_separate' ? 'text-white' : 'text-gray-500'
            }`}
          >
            単語ごとに分けて入力
          </Text>
        </TouchableOpacity>
      </View>

      {/* 判定設定 - ホストありモードのみ表示 */}
      {selectedMode === 'all-at-once-host' && (
        <>
          <Text className="mb-2 font-bold">判定設定</Text>
          <View className="flex-row justify-between mb-4">
            <TouchableOpacity
              onPress={() => onPartialPointsChange(true)}
              disabled={disabled}
              className={`flex-1 mr-2 p-4 rounded-lg border-2 items-center justify-center ${
                allowPartialPoints
                  ? 'bg-app-primary border-app-primary'
                  : 'bg-transparent border-gray-300 active:bg-gray-50'
              } ${disabled ? 'opacity-50' : ''}`}
            >
              <Text
                className={`text-center font-bold ${
                  allowPartialPoints ? 'text-white' : 'text-gray-700'
                }`}
              >
                惜しい判定を有効
              </Text>
              <Text
                className={`text-xs text-center mt-1 ${
                  allowPartialPoints ? 'text-white' : 'text-gray-500'
                }`}
              >
                惜しい: 5ptを選択可能
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPartialPointsChange(false)}
              disabled={disabled}
              className={`flex-1 ml-2 p-4 rounded-lg border-2 items-center justify-center ${
                !allowPartialPoints
                  ? 'bg-app-primary border-app-primary'
                  : 'bg-transparent border-gray-300 active:bg-gray-50'
              } ${disabled ? 'opacity-50' : ''}`}
            >
              <Text
                className={`text-center font-bold ${
                  !allowPartialPoints ? 'text-white' : 'text-gray-700'
                }`}
              >
                正誤判定のみ
              </Text>
              <Text
                className={`text-xs text-center mt-1 ${
                  !allowPartialPoints ? 'text-white' : 'text-gray-500'
                }`}
              >
                正解: 10pt、不正解: 0pt
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ホストなしモードの場合の設定と説明 */}
      {selectedMode === 'all-at-once-auto' && (
        <>
          {/* 最大再生回数設定 */}
          <Text className="mb-2 font-bold">最大再生回数</Text>
          <View className="flex-row justify-between mb-4">
            {[1, 2, 3, 4, 5].map((count) => (
              <TouchableOpacity
                key={count}
                onPress={() => onMaxReplayCountChange(count)}
                disabled={disabled}
                className={`flex-1 mx-1 p-3 rounded-lg border-2 items-center justify-center ${
                  maxReplayCount === count
                    ? 'bg-app-primary border-app-primary'
                    : 'bg-transparent border-gray-300 active:bg-gray-50'
                } ${disabled ? 'opacity-50' : ''}`}
              >
                <Text
                  className={`text-center font-bold ${
                    maxReplayCount === count ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {count}回
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 説明 */}
          <View className="bg-app-warning-light p-4 rounded-lg border border-app-warning">
            <Text className="text-app-warning-dark font-bold mb-2">ホストなしモードの特徴</Text>
            <Text className="text-app-warning-dark text-sm mb-1">• 参加者全員が回答できます</Text>
            <Text className="text-app-warning-dark text-sm mb-1">
              • 1人{maxReplayCount}回まで音声を再生できます
            </Text>
            <Text className="text-app-warning-dark text-sm mb-1">
              • 回答は自動で正誤判定されます
            </Text>
            <Text className="text-app-warning-dark text-sm">• 惜しい判定は利用できません</Text>
          </View>
        </>
      )}
    </View>
  );
};

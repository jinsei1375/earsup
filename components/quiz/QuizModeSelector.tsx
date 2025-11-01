// components/quiz/QuizModeSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface QuizModeSelectorProps {
  selectedMode: 'all-at-once-host' | 'all-at-once-auto';
  onModeChange: (mode: 'all-at-once-host' | 'all-at-once-auto') => void;
  quizInputType: 'sentence' | 'word_separate' | 'word_selection';
  onQuizInputTypeChange: (type: 'sentence' | 'word_separate' | 'word_selection') => void;
  allowPartialPoints: boolean;
  onPartialPointsChange: (allow: boolean) => void;
  partialJudgmentThreshold: number;
  onPartialJudgmentThresholdChange: (threshold: number) => void;
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
  partialJudgmentThreshold,
  onPartialJudgmentThresholdChange,
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
      <View className="mb-4">
        <View className="flex-row justify-between mb-2">
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
              文章全体を入力
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
              単語ごとに入力
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => onQuizInputTypeChange('word_selection')}
          disabled={disabled}
          className={`w-full p-4 rounded-lg border-2 items-center justify-center ${
            quizInputType === 'word_selection'
              ? 'bg-app-primary border-app-primary'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              quizInputType === 'word_selection' ? 'text-white' : 'text-gray-700'
            }`}
          >
            単語選択
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              quizInputType === 'word_selection' ? 'text-white' : 'text-gray-500'
            }`}
          >
            単語を選んでドラッグ&ドロップ
          </Text>
        </TouchableOpacity>
      </View>

      {/* 判定設定 */}

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

      {/* ホストなしモードの場合の設定と説明 */}
      {selectedMode === 'all-at-once-auto' && (
        <>
          {/* 惜しい判定の閾値設定（ホストなしモード時） */}
          {allowPartialPoints && (
            <>
              <Text className="mb-2 font-bold">惜しい判定の閾値</Text>
              <Text className="mb-3 text-sm text-gray-600">
                単語の一致率が設定値以上で惜しい判定になります
              </Text>

              <View className="flex-row justify-between mb-4">
                {[50, 60, 70, 80, 90].map((threshold) => (
                  <TouchableOpacity
                    key={threshold}
                    onPress={() => onPartialJudgmentThresholdChange(threshold)}
                    disabled={disabled}
                    className={`flex-1 mx-1 p-3 rounded-lg border-2 items-center justify-center ${
                      partialJudgmentThreshold === threshold
                        ? 'bg-app-primary border-app-primary'
                        : 'bg-transparent border-gray-300 active:bg-gray-50'
                    } ${disabled ? 'opacity-50' : ''}`}
                  >
                    <Text
                      className={`text-center font-bold ${
                        partialJudgmentThreshold === threshold ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {threshold}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

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
        </>
      )}
    </View>
  );
};

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '@/components/common/Button';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';
import {
  generateWordSelectionData,
  reconstructAnswerFromSlots,
  WordToken,
  WordSlot,
} from '@/utils/wordSelectionUtils';
import type { ParsedItem } from '@/utils/wordParseUtils';

interface WordSelectionInputProps {
  questionText: string;
  disabled?: boolean;
  onSubmit: (answer: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const WordSelectionInput: React.FC<WordSelectionInputProps> = ({
  questionText,
  disabled = false,
  onSubmit,
  isSubmitting = false,
}) => {
  const [selectionData] = useState(() => generateWordSelectionData(questionText));
  const [slots, setSlots] = useState<WordSlot[]>(selectionData.slots);
  const [availableTokens, setAvailableTokens] = useState<WordToken[]>(selectionData.tokens);
  const [selectedToken, setSelectedToken] = useState<WordToken | null>(null);

  const parsedSentence: ParsedItem[] = selectionData.parsedSentence;

  // Handle token selection from available pool
  const handleSelectToken = (token: WordToken) => {
    if (disabled || isSubmitting) return;
    setSelectedToken(token);
  };

  // Handle placing selected token in a slot
  const handlePlaceInSlot = (slotIndex: number) => {
    if (!selectedToken || disabled || isSubmitting) return;

    const newSlots = [...slots];
    const targetSlot = newSlots[slotIndex];

    // If the slot already has a token, return it to available tokens
    if (targetSlot.selectedToken) {
      setAvailableTokens((prev) => [...prev, targetSlot.selectedToken!]);
    }

    // Place the selected token in the slot
    targetSlot.selectedToken = selectedToken;
    setSlots(newSlots);

    // Remove token from available tokens
    setAvailableTokens((prev) => prev.filter((t) => t.id !== selectedToken.id));
    setSelectedToken(null);
  };

  // Handle removing token from slot back to available pool
  const handleRemoveFromSlot = (slotIndex: number) => {
    if (disabled || isSubmitting) return;

    const newSlots = [...slots];
    const slot = newSlots[slotIndex];

    if (slot.selectedToken) {
      setAvailableTokens((prev) => [...prev, slot.selectedToken!]);
      slot.selectedToken = null;
      setSlots(newSlots);
    }
  };

  const handleSubmit = async () => {
    const answer = reconstructAnswerFromSlots(parsedSentence, slots);
    await onSubmit(answer);
  };

  const handleReset = () => {
    // Return all tokens to available tokens
    setAvailableTokens(selectionData.tokens);
    setSlots(
      selectionData.slots.map((slot) => ({
        ...slot,
        selectedToken: null,
      }))
    );
    setSelectedToken(null);
  };

  const filledCount = slots.filter((slot) => slot.selectedToken !== null).length;
  const canSubmit = filledCount > 0 && !disabled && !isSubmitting;

  const renderToken = (token: WordToken, isSelected: boolean) => {
    return (
      <TouchableOpacity
        key={token.id}
        activeOpacity={0.7}
        disabled={disabled || isSubmitting}
        onPress={() => handleSelectToken(token)}
        className={`px-4 py-2 m-1 rounded-lg border-2 ${
          isSelected
            ? 'bg-app-primary border-app-primary'
            : 'bg-white border-app-neutral-400'
        } ${disabled || isSubmitting ? 'opacity-50' : ''}`}
      >
        <Text
          className={`text-base font-medium ${
            isSelected ? 'text-white' : 'text-app-neutral-800'
          }`}
        >
          {token.text}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSlot = (slot: WordSlot, slotIndex: number) => {
    const hasToken = slot.selectedToken !== null;
    
    return (
      <TouchableOpacity
        key={`slot-${slotIndex}`}
        activeOpacity={0.7}
        disabled={disabled || isSubmitting}
        onPress={() => {
          if (hasToken) {
            handleRemoveFromSlot(slotIndex);
          } else if (selectedToken) {
            handlePlaceInSlot(slotIndex);
          }
        }}
        className={`min-w-[80px] px-3 py-3 border-2 rounded-lg mb-2 ${
          hasToken
            ? 'border-app-success bg-app-success-light'
            : selectedToken
            ? 'border-app-primary border-dashed bg-app-primary-light'
            : 'border-app-neutral-400 border-dashed bg-app-neutral-100'
        } ${disabled || isSubmitting ? 'opacity-50' : ''}`}
        style={{ minHeight: 44 }}
      >
        {hasToken ? (
          <View className="flex-row items-center justify-center">
            <Text className="text-base font-medium text-app-success-dark mr-1">
              {slot.selectedToken!.text}
            </Text>
            <FeatureIcon name="close-circle" size={16} color={APP_COLORS.danger} />
          </View>
        ) : (
          <View className="items-center justify-center">
            <Text className="text-app-neutral-400 text-sm">{slotIndex + 1}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView className="bg-white rounded-xl p-4 shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-app-neutral-800">単語を選択してください</Text>
        <View className="flex-row items-center">
          <FeatureIcon name="albums-outline" size={20} color={APP_COLORS.gray600} />
          <Text className="ml-1 text-sm text-app-neutral-600">
            {availableTokens.length + slots.filter((s) => s.selectedToken).length}単語
          </Text>
        </View>
      </View>

      {/* 説明 */}
      <View className="mb-4 p-3 bg-app-primary-light rounded-lg">
        <Text className="text-sm text-app-primary-dark">
          {selectedToken
            ? '配置したい位置をタップしてください'
            : '正しい単語を選んで、空欄に配置してください'}
        </Text>
      </View>

      {/* Available tokens pool */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-app-neutral-700 mb-2">選択可能な単語:</Text>
        <View className="flex-row flex-wrap min-h-[60px] p-2 bg-app-neutral-50 rounded-lg border border-app-neutral-300">
          {availableTokens.length > 0 ? (
            availableTokens.map((token) =>
              renderToken(token, selectedToken?.id === token.id)
            )
          ) : (
            <Text className="text-app-neutral-400 text-center w-full py-4">
              全ての単語が配置されました
            </Text>
          )}
        </View>
      </View>

      {/* Sentence with drop zones */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-app-neutral-700 mb-2">
          文章を完成させてください:
        </Text>
        <View
          className="flex-row flex-wrap items-baseline p-2 bg-white rounded-lg border border-app-primary"
          style={{ gap: 4 }}
        >
          {parsedSentence.map((item, sentenceIndex) => {
            if (item.isPunctuation) {
              const isApostrophe = /^['']/.test(item.text);
              return (
                <Text
                  key={`punct-${sentenceIndex}`}
                  className={`text-2xl text-app-neutral-800 ${
                    isApostrophe ? 'self-start' : 'self-end'
                  }`}
                  style={{
                    lineHeight: isApostrophe ? 20 : 32,
                    marginTop: isApostrophe ? -8 : 0,
                    marginBottom: isApostrophe ? 0 : 4,
                    height: isApostrophe ? 20 : 'auto',
                  }}
                >
                  {item.text}
                </Text>
              );
            }

            const slotIndex = item.index;
            const slot = slots[slotIndex];

            return renderSlot(slot, slotIndex);
          })}
        </View>
      </View>

      {/* Progress */}
      <View className="mb-4">
        <Text className="text-center text-app-neutral-600 mb-2">
          進捗: {filledCount}/{slots.length} 単語
        </Text>
        <View className="bg-app-neutral-200 rounded-full h-2">
          <View
            className="bg-app-primary rounded-full h-2"
            style={{ width: `${(filledCount / slots.length) * 100}%` }}
          />
        </View>

        {/* Preview */}
        {filledCount > 0 && (
          <View className="mt-3 p-3 bg-app-neutral-100 rounded-lg">
            <Text className="text-sm text-app-neutral-600 mb-2">プレビュー:</Text>
            <Text className="text-app-neutral-800">
              {reconstructAnswerFromSlots(parsedSentence, slots)}
            </Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button
            title="リセット"
            onPress={handleReset}
            disabled={filledCount === 0 || disabled || isSubmitting}
            variant="outline"
          />
        </View>
        <View className="flex-1">
          <Button
            title={isSubmitting ? '送信中...' : '回答を提出'}
            onPress={handleSubmit}
            disabled={!canSubmit}
            variant="primary"
          />
        </View>
      </View>
    </ScrollView>
  );
};

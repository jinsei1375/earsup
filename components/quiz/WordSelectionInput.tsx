import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
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

interface TokenPosition {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const [draggedToken, setDraggedToken] = useState<WordToken | null>(null);
  const [draggedFromSlot, setDraggedFromSlot] = useState<number | null>(null);

  // Token and slot positions for drag and drop calculation
  const tokenPositions = useRef<Map<string, TokenPosition>>(new Map());
  const slotPositions = useRef<Map<number, TokenPosition>>(new Map());

  // Animated value for drag position
  const pan = useRef(new Animated.ValueXY()).current;

  const parsedSentence: ParsedItem[] = selectionData.parsedSentence;

  // Create PanResponder for drag and drop
  const createPanResponder = (token: WordToken, fromSlotIndex: number | null) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !isSubmitting,
      onPanResponderGrant: () => {
        setDraggedToken(token);
        setDraggedFromSlot(fromSlotIndex);
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        handleDrop(gesture.moveX, gesture.moveY);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        setDraggedToken(null);
        setDraggedFromSlot(null);
      },
    });
  };

  const handleDrop = (x: number, y: number) => {
    if (!draggedToken) return;

    // Find which slot the token was dropped on
    let targetSlotIndex: number | null = null;
    slotPositions.current.forEach((pos, index) => {
      if (
        x >= pos.x &&
        x <= pos.x + pos.width &&
        y >= pos.y &&
        y <= pos.y + pos.height
      ) {
        targetSlotIndex = index;
      }
    });

    if (targetSlotIndex !== null) {
      // Token dropped on a slot
      const newSlots = [...slots];
      const targetSlot = newSlots[targetSlotIndex];

      // If the slot already has a token, return it to available tokens
      if (targetSlot.selectedToken) {
        setAvailableTokens((prev) => [...prev, targetSlot.selectedToken!]);
      }

      // Place the dragged token in the slot
      targetSlot.selectedToken = draggedToken;
      setSlots(newSlots);

      // Remove token from available tokens if it came from there
      if (draggedFromSlot === null) {
        setAvailableTokens((prev) => prev.filter((t) => t.id !== draggedToken.id));
      } else if (draggedFromSlot !== targetSlotIndex) {
        // If dragged from another slot, clear that slot
        newSlots[draggedFromSlot].selectedToken = null;
      }
    } else {
      // Token dropped outside any slot - return to available tokens if it came from a slot
      if (draggedFromSlot !== null) {
        const newSlots = [...slots];
        newSlots[draggedFromSlot].selectedToken = null;
        setSlots(newSlots);
        setAvailableTokens((prev) => [...prev, draggedToken]);
      }
    }
  };

  const handleTokenLayout = (tokenId: string, event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    event.target.measure((fx, fy, w, h, px, py) => {
      tokenPositions.current.set(tokenId, { x: px, y: py, width: w, height: h });
    });
  };

  const handleSlotLayout = (slotIndex: number, event: LayoutChangeEvent) => {
    event.target.measure((fx, fy, w, h, px, py) => {
      slotPositions.current.set(slotIndex, { x: px, y: py, width: w, height: h });
    });
  };

  const handleSubmit = async () => {
    const answer = reconstructAnswerFromSlots(parsedSentence, slots);
    await onSubmit(answer);
  };

  const handleReset = () => {
    // Return all tokens to available tokens
    const tokensFromSlots = slots
      .map((slot) => slot.selectedToken)
      .filter((token): token is WordToken => token !== null);

    setAvailableTokens(selectionData.tokens);
    setSlots(
      selectionData.slots.map((slot) => ({
        ...slot,
        selectedToken: null,
      }))
    );
  };

  const filledCount = slots.filter((slot) => slot.selectedToken !== null).length;
  const canSubmit = filledCount > 0 && !disabled && !isSubmitting;

  const renderToken = (
    token: WordToken,
    fromSlotIndex: number | null,
    isInSlot: boolean
  ) => {
    const panResponder = createPanResponder(token, fromSlotIndex);
    const isDragging = draggedToken?.id === token.id;

    return (
      <Animated.View
        key={token.id}
        {...panResponder.panHandlers}
        style={[
          isDragging && {
            transform: pan.getTranslateTransform(),
            zIndex: 1000,
          },
        ]}
        onLayout={(e) => !isInSlot && handleTokenLayout(token.id, e)}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={disabled || isSubmitting}
          className={`px-4 py-2 m-1 rounded-lg border-2 ${
            isDragging
              ? 'bg-app-primary-light border-app-primary opacity-50'
              : isInSlot
              ? 'bg-app-success-light border-app-success'
              : 'bg-white border-app-neutral-400'
          } ${disabled || isSubmitting ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-base font-medium ${
              isDragging
                ? 'text-app-primary'
                : isInSlot
                ? 'text-app-success-dark'
                : 'text-app-neutral-800'
            }`}
          >
            {token.text}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-app-neutral-800">単語を選択してください</Text>
        <View className="flex-row items-center">
          <FeatureIcon name="shuffle" size={20} color={APP_COLORS.gray600} />
          <Text className="ml-1 text-sm text-app-neutral-600">
            {availableTokens.length + slots.filter((s) => s.selectedToken).length}単語
          </Text>
        </View>
      </View>

      {/* 説明 */}
      <View className="mb-4 p-3 bg-app-primary-light rounded-lg">
        <Text className="text-sm text-app-primary-dark">
          正しい単語を選んで、下の空欄にドラッグ&ドロップしてください
        </Text>
      </View>

      {/* Available tokens pool */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-app-neutral-700 mb-2">選択可能な単語:</Text>
        <View className="flex-row flex-wrap min-h-[60px] p-2 bg-app-neutral-50 rounded-lg border border-app-neutral-300">
          {availableTokens.length > 0 ? (
            availableTokens.map((token) => renderToken(token, null, false))
          ) : (
            <Text className="text-app-neutral-400 text-center w-full py-4">
              全ての単語が配置されました
            </Text>
          )}
        </View>
      </View>

      {/* Sentence with drop zones */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-app-neutral-700 mb-2">文章を完成させてください:</Text>
        <View className="flex-row flex-wrap items-baseline p-2 bg-white rounded-lg border border-app-primary" style={{ gap: 4 }}>
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

            return (
              <View
                key={`slot-${slotIndex}`}
                onLayout={(e) => handleSlotLayout(slotIndex, e)}
                className="mb-2"
              >
                <View
                  className={`min-w-[80px] px-3 py-2 border-2 border-dashed rounded-lg ${
                    slot.selectedToken
                      ? 'border-app-success bg-app-success-light'
                      : 'border-app-neutral-400 bg-app-neutral-100'
                  }`}
                  style={{ minHeight: 44 }}
                >
                  {slot.selectedToken ? (
                    renderToken(slot.selectedToken, slotIndex, true)
                  ) : (
                    <View className="items-center justify-center py-1">
                      <Text className="text-app-neutral-400 text-sm">{slotIndex + 1}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
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
    </View>
  );
};

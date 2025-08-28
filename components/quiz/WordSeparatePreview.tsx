// components/quiz/WordSeparatePreview.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { parsesentence, getWordItems } from '@/utils/wordParseUtils';

interface WordSeparatePreviewProps {
  text: string;
}

export const WordSeparatePreview: React.FC<WordSeparatePreviewProps> = ({ text }) => {
  if (!text.trim()) return null;

  const parsedSentence = parsesentence(text);
  const wordItems = getWordItems(parsedSentence);

  return (
    <View className="mt-3 p-3 bg-app-neutral-100 rounded-lg">
      <Text className="text-sm text-app-neutral-600 mb-2">単語区切りプレビュー:</Text>
      <Text className="text-xs text-app-neutral-500 mb-3">
        {wordItems.length}個の単語に分かれます
      </Text>

      {/* 単語区切り表示 */}
      <View className="flex-row flex-wrap items-baseline">
        {parsedSentence.map((item, index) => {
          if (item.isPunctuation) {
            // アポストロフィ（半角・全角）は少し上に、その他の句読点は下部に
            const isApostrophe = /^['’]$/.test(item.text);
            return (
              <Text
                key={index}
                className={`text-app-neutral-400 text-base ${
                  isApostrophe ? 'self-start' : 'self-end'
                }`}
                style={{
                  lineHeight: isApostrophe ? 16 : 24,
                  marginTop: isApostrophe ? -4 : 0,
                  marginBottom: isApostrophe ? 0 : 2,
                }}
              >
                {item.text}
              </Text>
            );
          } else {
            return (
              <View key={index} className="flex-row items-center mb-1">
                <View className="bg-app-primary-50 border border-app-primary-200 rounded px-2 py-1 mx-1">
                  <Text className="text-app-primary-700 text-sm font-medium">{item.text}</Text>
                </View>
              </View>
            );
          }
        })}
      </View>

      <Text className="text-xs text-app-neutral-500 mt-2">青い部分が入力フィールドになります</Text>
    </View>
  );
};

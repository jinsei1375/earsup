// utils/wordSelectionUtils.ts

import { parsesentence, getWordItems, ParsedItem } from './wordParseUtils';

/**
 * 単語選択モード用のデータ構造
 */
export interface WordToken {
  id: string;
  text: string;
  isCorrect: boolean; // 正解の単語か
  correctIndex?: number; // 正解の位置（正解の単語の場合）
}

export interface WordSlot {
  index: number;
  expectedWord: string;
  selectedToken: WordToken | null;
}

/**
 * 簡単なディストラクター（関係ない単語）を生成
 * 実際には、より洗練されたロジックが必要になる可能性があります
 */
const COMMON_DISTRACTORS = [
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'should',
  'could',
  'may',
  'might',
  'must',
  'can',
  'my',
  'your',
  'his',
  'her',
  'its',
  'our',
  'their',
  'this',
  'that',
  'these',
  'those',
  'good',
  'bad',
  'big',
  'small',
  'long',
  'short',
  'new',
  'old',
  'hot',
  'cold',
  'fast',
  'slow',
  'happy',
  'sad',
  'go',
  'come',
  'get',
  'make',
  'take',
  'see',
  'know',
  'think',
  'want',
  'need',
  'like',
  'love',
  'hate',
];

/**
 * 各単語に対して1つのディストラクターを生成
 */
export const generateDistractors = (correctWords: string[]): string[] => {
  const distractors: string[] = [];
  const usedDistractors = new Set<string>();
  const correctWordsLower = correctWords.map((w) => w.toLowerCase());

  correctWords.forEach((word) => {
    const wordLower = word.toLowerCase();

    // 正解の単語と重複しないディストラクターを選択
    const availableDistractors = COMMON_DISTRACTORS.filter(
      (d) =>
        d !== wordLower && // 正解の単語自体を避ける
        !correctWordsLower.includes(d) && // 他の正解単語と重複を避ける
        !usedDistractors.has(d) // すでに使用したディストラクターを避ける
    );

    if (availableDistractors.length > 0) {
      // ランダムに1つ選択
      const randomIndex = Math.floor(Math.random() * availableDistractors.length);
      const distractor = availableDistractors[randomIndex];
      distractors.push(distractor);
      usedDistractors.add(distractor);
    } else {
      // フォールバック: 利用可能なディストラクターがない場合
      distractors.push('word');
    }
  });

  return distractors;
};

/**
 * 単語選択モード用のトークンとスロットを生成
 */
export const generateWordSelectionData = (
  sentence: string
): {
  tokens: WordToken[];
  slots: WordSlot[];
  parsedSentence: ParsedItem[];
} => {
  const parsedSentence = parsesentence(sentence);
  const wordItems = getWordItems(parsedSentence);
  const correctWords = wordItems.map((item) => item.text);

  // ディストラクターを生成
  const distractors = generateDistractors(correctWords);

  // トークンを生成（正解 + ディストラクター）
  const correctTokens: WordToken[] = correctWords.map((word, index) => ({
    id: `correct-${index}`,
    text: word,
    isCorrect: true,
    correctIndex: index,
  }));

  const distractorTokens: WordToken[] = distractors.map((word, index) => ({
    id: `distractor-${index}`,
    text: word,
    isCorrect: false,
  }));

  // トークンをシャッフル
  const allTokens = [...correctTokens, ...distractorTokens];
  const shuffledTokens = shuffleArray(allTokens);

  // スロットを生成
  const slots: WordSlot[] = correctWords.map((word, index) => ({
    index,
    expectedWord: word,
    selectedToken: null,
  }));

  return {
    tokens: shuffledTokens,
    slots,
    parsedSentence,
  };
};

/**
 * 配列をシャッフル（Fisher-Yatesアルゴリズム）
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Unicode character constants
const RIGHT_SINGLE_QUOTATION_MARK = '\u2019'; // Curly apostrophe '

/**
 * スロットから回答文を再構築
 */
export const reconstructAnswerFromSlots = (
  parsedSentence: ParsedItem[],
  slots: WordSlot[]
): string => {
  const selectedWords = slots.map((slot) => slot.selectedToken?.text || '');
  
  let result = '';
  let needSpace = false;

  parsedSentence.forEach((item) => {
    if (item.isPunctuation) {
      result += item.text;
      needSpace = !['"', "'", RIGHT_SINGLE_QUOTATION_MARK].includes(item.text);
    } else {
      const word = selectedWords[item.index] || '';
      if (word) {
        if (needSpace && result.length > 0) {
          result += ' ';
        }
        result += word;
        needSpace = true;
      }
    }
  });

  return result;
};

// utils/diffUtils.ts
export interface DiffWord {
  text: string;
  type: 'match' | 'different' | 'missing' | 'extra';
  index: number;
}

export interface DiffResult {
  userWords: DiffWord[];
  correctWords: DiffWord[];
  accuracy: number;
  totalWords: number;
  matchedWords: number;
}

/**
 * テキストを単語に分割（句読点も考慮）
 */
function tokenizeText(text: string): string[] {
  return (
    text
      .trim()
      // 文末の句読点を除去
      .replace(/[.!?]+$/, '')
      .split(/\s+/)
      .filter((word) => word.length > 0)
  );
}

/**
 * 2つの単語が類似しているかチェック（タイポ許容）
 */
function isSimilar(word1: string, word2: string, threshold: number = 0.8): boolean {
  // 大文字小文字を無視して比較
  const normalizedWord1 = word1.toLowerCase();
  const normalizedWord2 = word2.toLowerCase();

  if (normalizedWord1 === normalizedWord2) return true;

  // レーベンシュタイン距離を使用した類似度チェック
  const distance = levenshteinDistance(normalizedWord1, normalizedWord2);
  const maxLength = Math.max(normalizedWord1.length, normalizedWord2.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= threshold;
}

/**
 * レーベンシュタイン距離を計算
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * ユーザーの回答と正解を比較して差分を生成
 */
export function generateDiff(userAnswer: string, correctAnswer: string): DiffResult {
  const userWords = tokenizeText(userAnswer);
  const correctWords = tokenizeText(correctAnswer);

  const userDiffWords: DiffWord[] = [];
  const correctDiffWords: DiffWord[] = [];

  let matchedWords = 0;
  const usedCorrectIndices = new Set<number>();

  // ユーザーの回答の各単語をチェック
  for (let i = 0; i < userWords.length; i++) {
    const userWord = userWords[i];
    let matched = false;

    // 正解の単語と比較
    for (let j = 0; j < correctWords.length; j++) {
      if (usedCorrectIndices.has(j)) continue;

      const correctWord = correctWords[j];
      if (isSimilar(userWord, correctWord)) {
        // 大文字小文字を無視して完全一致かチェック
        const isExactMatch = userWord.toLowerCase() === correctWord.toLowerCase();

        userDiffWords.push({
          text: userWord, // ユーザーが入力した元の形を保持
          type: isExactMatch ? 'match' : 'different',
          index: i,
        });

        correctDiffWords.push({
          text: correctWord, // 正解の元の形を保持
          type: isExactMatch ? 'match' : 'different',
          index: j,
        });

        usedCorrectIndices.add(j);
        if (isExactMatch) {
          matchedWords++;
        }
        matched = true;
        break;
      }
    }

    // マッチしなかった場合は余分な単語として扱う
    if (!matched) {
      userDiffWords.push({
        text: userWord,
        type: 'extra',
        index: i,
      });
    }
  }

  // 正解で使用されなかった単語は欠落として扱う
  for (let j = 0; j < correctWords.length; j++) {
    if (!usedCorrectIndices.has(j)) {
      correctDiffWords.push({
        text: correctWords[j],
        type: 'missing',
        index: j,
      });
    }
  }

  // インデックス順にソート
  correctDiffWords.sort((a, b) => a.index - b.index);

  // より厳密な正答率の計算
  let accuracy = 0;
  if (correctWords.length > 0) {
    const extraWordsCount = userDiffWords.filter((word) => word.type === 'extra').length;
    const missingWordsCount = correctDiffWords.filter((word) => word.type === 'missing').length;
    const differentWordsCount = userDiffWords.filter((word) => word.type === 'different').length;

    // 総単語数（正解の単語数 + 余分な単語数）
    const totalWordsConsidered = correctWords.length + extraWordsCount;

    // 完全一致した単語のみを正解とカウント
    accuracy = totalWordsConsidered > 0 ? (matchedWords / totalWordsConsidered) * 100 : 0;
  }

  return {
    userWords: userDiffWords,
    correctWords: correctDiffWords,
    accuracy: Math.round(accuracy),
    totalWords: correctWords.length,
    matchedWords,
  };
}

/**
 * 判定結果を取得（完全一致、惜しい、不正解）
 */
export function getJudgmentResult(
  userAnswer: string,
  correctAnswer: string
): 'correct' | 'close' | 'incorrect' {
  // 文末の句読点を除去してから比較
  const normalizeForJudgment = (text: string) => {
    return text
      .trim()
      .replace(/[.!?]+$/, '')
      .toLowerCase();
  };

  const normalizedUser = normalizeForJudgment(userAnswer);
  const normalizedCorrect = normalizeForJudgment(correctAnswer);

  // 完全一致（大文字小文字・句読点を無視）
  if (normalizedUser === normalizedCorrect) {
    return 'correct';
  }

  const diff = generateDiff(userAnswer, correctAnswer);

  // 80%以上の一致率で「惜しい」
  if (diff.accuracy >= 80) {
    return 'close';
  }

  return 'incorrect';
}

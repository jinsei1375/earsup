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
    normalizeApostrophes(text)
      .trim()
      // 文末の句読点を除去
      .replace(/[.!?]+$/, '')
      .split(/\s+/)
      .filter((word) => word.length > 0)
  );
}

/**
 * アポストロフィの違いを正規化
 */
function normalizeApostrophes(text: string): string {
  return text.replace(/['’]/g, "'");
}

/**
 * 2つの単語が類似しているかチェック（タイポ許容）
 */
function isSimilar(word1: string, word2: string, threshold: number = 0.8): boolean {
  // 大文字小文字とアポストロフィを正規化して比較
  const normalizedWord1 = normalizeApostrophes(word1.toLowerCase());
  const normalizedWord2 = normalizeApostrophes(word2.toLowerCase());

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
 * LCSベースのアライメント構造
 */
interface AlignmentItem {
  userIndex: number | null; // null = missing word
  correctIndex: number | null; // null = extra word
  isMatch: boolean;
  isDifferent: boolean;
}

/**
 * Edit Distance（編集距離）を使用した厳密なシーケンスアライメント
 * 単語の順序を保持しながら最小の編集操作でマッチングを行う
 */
function calculateEditDistanceAlignment(
  userWords: string[],
  correctWords: string[]
): AlignmentItem[] {
  const m = userWords.length;
  const n = correctWords.length;

  // DP table for edit distance
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  const ops = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(''));

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i; // deletions
    ops[i][0] = 'delete';
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j; // insertions
    ops[0][j] = 'insert';
  }
  ops[0][0] = '';

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const userWord = userWords[i - 1];
      const correctWord = correctWords[j - 1];

      // Cost of substitute/match
      const substituteCost = isSimilar(userWord, correctWord) ? 0 : 1;

      const substitute = dp[i - 1][j - 1] + substituteCost;
      const deleteOp = dp[i - 1][j] + 1;
      const insertOp = dp[i][j - 1] + 1;

      if (substitute <= deleteOp && substitute <= insertOp) {
        dp[i][j] = substitute;
        ops[i][j] = substituteCost === 0 ? 'match' : 'substitute';
      } else if (deleteOp <= insertOp) {
        dp[i][j] = deleteOp;
        ops[i][j] = 'delete';
      } else {
        dp[i][j] = insertOp;
        ops[i][j] = 'insert';
      }
    }
  }

  // Backtrack to get alignment
  const alignment: AlignmentItem[] = [];
  let i = m,
    j = n;

  while (i > 0 || j > 0) {
    const op = ops[i][j];

    if (op === 'match' || op === 'substitute') {
      const userWord = userWords[i - 1];
      const correctWord = correctWords[j - 1];
      const isExactMatch = userWord.toLowerCase() === correctWord.toLowerCase();

      alignment.unshift({
        userIndex: i - 1,
        correctIndex: j - 1,
        isMatch: isExactMatch,
        isDifferent: !isExactMatch && isSimilar(userWord, correctWord),
      });
      i--;
      j--;
    } else if (op === 'delete') {
      alignment.unshift({
        userIndex: i - 1,
        correctIndex: null,
        isMatch: false,
        isDifferent: false,
      });
      i--;
    } else {
      // insert
      alignment.unshift({
        userIndex: null,
        correctIndex: j - 1,
        isMatch: false,
        isDifferent: false,
      });
      j--;
    }
  }

  return alignment;
}

/**
 * ユーザーの回答と正解を比較して差分を生成（改良版）
 */
export function generateDiff(userAnswer: string, correctAnswer: string): DiffResult {
  const userWords = tokenizeText(userAnswer);
  const correctWords = tokenizeText(correctAnswer);

  // Edit Distanceベースのアライメントを計算
  const alignment = calculateEditDistanceAlignment(userWords, correctWords);

  const userDiffWords: DiffWord[] = [];
  const correctDiffWords: DiffWord[] = [];
  let matchedWords = 0;

  // アライメント結果からDiffWordを生成
  for (const item of alignment) {
    if (item.userIndex !== null && item.correctIndex !== null) {
      // マッチした単語ペア
      const userWord = userWords[item.userIndex];
      const correctWord = correctWords[item.correctIndex];

      const type = item.isMatch ? 'match' : 'different';

      userDiffWords.push({
        text: userWord,
        type,
        index: item.userIndex,
      });

      correctDiffWords.push({
        text: correctWord,
        type,
        index: item.correctIndex,
      });

      if (item.isMatch) {
        matchedWords++;
      }
    } else if (item.userIndex !== null) {
      // ユーザーの余分な単語
      userDiffWords.push({
        text: userWords[item.userIndex],
        type: 'extra',
        index: item.userIndex,
      });
    } else if (item.correctIndex !== null) {
      // 欠落した単語
      correctDiffWords.push({
        text: correctWords[item.correctIndex],
        type: 'missing',
        index: item.correctIndex,
      });
    }
  }

  // インデックス順にソート
  userDiffWords.sort((a, b) => a.index - b.index);
  correctDiffWords.sort((a, b) => a.index - b.index);

  // 正答率の計算
  let accuracy = 0;
  if (correctWords.length > 0) {
    const extraWordsCount = userDiffWords.filter((word) => word.type === 'extra').length;
    const totalWordsConsidered = correctWords.length + extraWordsCount;
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
 * 判定結果を決定する（設定可能な閾値）
 */
export function getJudgmentResult(
  userAnswer: string,
  correctAnswer: string,
  partialThreshold: number = 70
): 'correct' | 'close' | 'incorrect' {
  // 文末の句読点を除去してから比較
  const normalizeForJudgment = (text: string) => {
    return normalizeApostrophes(
      text
        .trim()
        .replace(/[.!?]+$/, '')
        .toLowerCase()
    );
  };

  const normalizedUser = normalizeForJudgment(userAnswer);
  const normalizedCorrect = normalizeForJudgment(correctAnswer);

  // 完全一致（大文字小文字・句読点を無視）
  if (normalizedUser === normalizedCorrect) {
    return 'correct';
  }

  const diff = generateDiff(userAnswer, correctAnswer);

  // 設定された閾値以上の一致率で「惜しい」
  if (diff.accuracy >= partialThreshold) {
    return 'close';
  }

  return 'incorrect';
}

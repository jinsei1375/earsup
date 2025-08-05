// Simple test script for validateAnswer function
// Copy the validateAnswer function directly here for testing

const validateAnswer = (answer, correctAnswer, excludePunctuation = false) => {
  // 文字列の正規化を行う関数
  const normalizeText = (text) => {
    let normalized = text.trim();

    // 全角・半角の正規化
    normalized = normalized
      // 全角英数字を半角に変換
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
      })
      // 全角スペースを半角スペースに変換
      .replace(/　/g, ' ')
      // 複数の半角スペースを1つに統一
      .replace(/\s+/g, ' ')
      // アポストロフィの正規化（' → '）
      .replace(/’/g, "'")
      // ダッシュの正規化（— → -）
      .replace(/—/g, '-')
      // ハイフンマイナス統一（− → -）
      .replace(/−/g, '-');

    // 句読点を除外する場合
    if (excludePunctuation) {
      normalized = normalized.replace(/[.,;:!?"'()[\]{}-]/g, '');
    }

    return normalized.toLowerCase();
  };

  const normalizedAnswer = normalizeText(answer);
  const normalizedCorrect = normalizeText(correctAnswer);

  return normalizedAnswer === normalizedCorrect;
};

// Test cases for the improved validation
const testCases = [
  // アポストロフィの違い
  { answer: "I'm happy", correct: "I'm happy", expected: true },
  { answer: "I'm happy", correct: "I'm happy", expected: true },
  { answer: 'don’t worry', correct: "don't worry", expected: true },
  { answer: "don't worry", correct: 'don’t worry', expected: true },
  { answer: "don't worry", correct: "don't worry", expected: true },

  // 全角・半角スペースの違い
  { answer: 'hello　world', correct: 'hello world', expected: true },
  { answer: 'hello  world', correct: 'hello world', expected: true },
  { answer: 'hello world', correct: 'hello　world', expected: true },

  // 全角英数字の違い
  { answer: 'Ｈｅｌｌｏ', correct: 'Hello', expected: true },
  { answer: '１２３', correct: '123', expected: true },

  // 句読点の違い（excludePunctuation = true）
  { answer: 'Hello world', correct: 'Hello world.', expected: true },
  { answer: 'Hello world!', correct: 'Hello world', expected: true },

  // 大文字小文字の違い
  { answer: 'HELLO WORLD', correct: 'hello world', expected: true },

  // 実際に異なる文章
  { answer: 'Hello world', correct: 'Goodbye world', expected: false },
];

console.log('Testing improved validateAnswer function:');
testCases.forEach((test, index) => {
  const result = validateAnswer(test.answer, test.correct, true);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} Test ${index + 1}: "${test.answer}" vs "${test.correct}" => ${result}`);
});

console.log('\nTesting with punctuation enabled (excludePunctuation = false):');
const punctuationTests = [
  { answer: 'Hello world', correct: 'Hello world.', expected: false },
  { answer: 'Hello world!', correct: 'Hello world', expected: false },
  { answer: 'Hello world.', correct: 'Hello world.', expected: true },
];

punctuationTests.forEach((test, index) => {
  const result = validateAnswer(test.answer, test.correct, false);
  const status = result === test.expected ? '✅' : '❌';
  console.log(
    `${status} Punctuation Test ${index + 1}: "${test.answer}" vs "${test.correct}" => ${result}`
  );
});

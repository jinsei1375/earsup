// Test script to validate the improved validateAnswer function
import { validateAnswer } from './utils/quizUtils';

// Test cases for the improved validation
const testCases = [
  // アポストロフィの違い
  { answer: "I'm happy", correct: "I'm happy", expected: true },
  { answer: "I'm happy", correct: "I'm happy", expected: true },
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

// Test the updated parsesentence function
function parsesentence(sentence) {
  const words = sentence.split(/\s+/).filter((word) => word.length > 0);
  const result = [];
  let wordIndex = 0;

  words.forEach((word) => {
    // アポストロフィを含む短縮形を正しく分離
    // It's -> It + ' + s, don't -> don + ' + t, etc.
    // 半角と全角のアポストロフィ両方に対応
    const parts = word.split(/([.!?,:;]|['’])/);

    parts.forEach((part) => {
      if (!part) return;

      if (/[.!?,:;]/.test(part)) {
        // 句読点として扱う
        result.push({ text: part, isPunctuation: true, index: -1 });
      } else if (/^['’]$/.test(part)) {
        // アポストロフィ（半角・全角）の処理
        result.push({ text: part, isPunctuation: true, index: -1 });
      } else if (part.trim()) {
        // 単語として扱う
        result.push({ text: part, isPunctuation: false, index: wordIndex++ });
      }
    });
  });

  return result;
}

// Test different sentences
const testSentences = [
  "It's hot today.",
  "I don't know.",
  "We'll see you later.",
  "It's hot today.", // 全角アポストロフィ
  "I don't know.", // 全角アポストロフィ
];

testSentences.forEach((sentence) => {
  console.log(`\nTest sentence: "${sentence}"`);
  const result = parsesentence(sentence);
  const words = result.filter((item) => !item.isPunctuation);
  console.log(`Words count: ${words.length}`);
  result.forEach((item, index) => {
    console.log(
      `${index}: "${item.text}" - ${item.isPunctuation ? 'PUNCTUATION' : 'WORD'} (index: ${
        item.index
      })`
    );
  });
});

// utils/wordParseUtils.ts

export interface ParsedItem {
  text: string;
  isPunctuation: boolean;
  index: number;
}

/**
 * 文章を単語と句読点に分離する
 * アポストロフィや句読点は別表示され、単語のみが入力対象となる
 */
export const parsesentence = (sentence: string): ParsedItem[] => {
  const words = sentence.split(/\s+/).filter((word) => word.length > 0);
  const result: ParsedItem[] = [];
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
};

/**
 * パースされた結果から単語のみを抽出
 */
export const getWordItems = (parsedSentence: ParsedItem[]): ParsedItem[] => {
  return parsedSentence.filter((item) => !item.isPunctuation);
};

/**
 * 単語と句読点を組み合わせて元の文章形式に戻す
 */
export const reconstructSentence = (parsedItems: ParsedItem[], words: string[]): string => {
  let result = '';
  let needSpace = false;

  parsedItems.forEach((item) => {
    if (item.isPunctuation) {
      // アポストロフィ（半角・全角）は前の文字にくっつける、その他の句読点も同様
      result += item.text;
      needSpace = !['"', "'", '’'].includes(item.text); // アポストロフィや引用符の後はスペース不要
    } else {
      // 単語の場合
      const word = words[item.index] || '';
      if (word) {
        // 最初の単語以外で、前がアポストロフィや引用符でない場合はスペースを追加
        if (needSpace && result.length > 0) {
          result += ' ';
        }
        result += word;
        needSpace = true; // 次にスペースが必要
      }
    }
  });

  return result;
};

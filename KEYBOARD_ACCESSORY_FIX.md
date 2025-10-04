# KeyboardAccessoryView 修正: 初回キーボード表示時のボタン動作不良

## 問題の詳細

KeyboardAccessoryViewの「次へ」と「前へ」ボタンが、**アプリ起動後の最初のキーボード表示時のみ**正しく動作しませんでした：

- 問題の症状: ボタンをタップするとキーボードが閉じてしまう
- 発生条件: アプリ起動後の初回のみ
- その後の動作: 2回目以降は正常に次の入力欄へフォーカスが移動する

## 根本原因

PR #37で`requestAnimationFrame`を使用した修正が試みられましたが、改善されませんでした。

### なぜ`requestAnimationFrame`では不十分だったのか

1. **実行タイミングの問題**:
   - `requestAnimationFrame`は次のペイント前に実行される
   - iOSのキーボードアニメーションやTextInputのref初期化はそれより後に完了する可能性がある

2. **iOSのInputAccessoryViewの特殊な動作**:
   - ボタンが押されたとき、すぐにTextInputがフォーカスされないと、iOS は「ユーザーが入力を終えた」と判断
   - デフォルトでキーボードを閉じる動作が発生

3. **初回表示時の競合条件**:
   ```
   ボタンタップ → コールバック実行 → focus()呼び出し
                                   ↓
                           refがまだnullまたは未初期化
                                   ↓
                           focus()が暗黙的に失敗
                                   ↓
                         キーボードが閉じる（iOS）
   ```

## 解決策

### 実装内容

プラットフォーム固有の`setTimeout`遅延を使用:

```typescript
const handleNext = () => {
  if (!disableNext && onNext) {
    // iOS: 100ms遅延でキーボードアニメーションとref初期化の完了を待つ
    // Android: 0ms遅延（即座に実行、この問題は発生しない）
    const delay = Platform.OS === 'ios' ? 100 : 0;
    setTimeout(() => {
      onNext();
    }, delay);
  }
};
```

### なぜこの解決策が機能するのか

1. **十分な待機時間**: 100msの遅延により、以下が確実に完了:
   - キーボードアニメーションの完了
   - TextInputのref初期化
   - すべてのレンダリング処理

2. **プラットフォーム固有の最適化**:
   - iOS: 100ms遅延（必要）
   - Android: 0ms遅延（即座に動作、体験を損なわない）

3. **ユーザー体験への配慮**:
   - 100msは人間が知覚しにくい短い時間
   - ボタンのフィードバック（`activeOpacity`）があるため、遅延は気にならない

## 試した他のアプローチ

1. ✗ `requestAnimationFrame` (PR #37) - タイミングが早すぎる
2. ✗ `setImmediate` - React Nativeでは`requestAnimationFrame`と同様
3. ✗ `Promise.resolve().then()` - マイクロタスクでも不十分
4. ✗ `InteractionManager.runAfterInteractions()` - すべてのインタラクション完了を待つため、遅延が不定
5. ✓ `setTimeout(fn, 100)` for iOS - 確実で予測可能

## 影響範囲

この修正は以下のすべての画面で有効:
- `app/diff-demo.tsx`
- `app/word-input-demo.tsx`
- `components/quiz/ParticipantQuizScreen.tsx`
- `components/quiz/QuestionCreator.tsx`
- `components/quiz/WordSeparateInput.tsx`
- `components/sentences/SentenceFormModal.tsx`

KeyboardAccessoryViewを使用しているすべての場所で、初回キーボード表示時のボタン動作が改善されます。

## 検証方法

1. アプリを完全に終了（バックグラウンドからも削除）
2. アプリを起動
3. 入力欄のある画面を開く（例: diff-demo）
4. 最初の入力欄をタップしてキーボードを表示
5. 「次へ」ボタンをタップ
6. **期待される動作**: キーボードが閉じずに次の入力欄にフォーカスが移動
7. **以前の動作**: キーボードが閉じてしまう

## 技術的な詳細

### 変更されたファイル

- `components/common/KeyboardAccessoryView.tsx`

### 変更内容

- `Platform` モジュールをインポート
- `handleNext` と `handlePrevious` 関数にプラットフォーム固有の遅延を追加
- コメントで動作原理を明記

### 後方互換性

- API変更なし
- 既存の使用箇所の修正不要
- すべてのプラットフォームで動作

## 参考資料

- React Native InputAccessoryView: https://reactnative.dev/docs/inputaccessoryview
- React Native Platform: https://reactnative.dev/docs/platform
- iOS Keyboard Handling Best Practices

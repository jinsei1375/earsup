# EarsUp - React Native 音声クイズアプリ

## アーキテクチャ概要

**EarsUp**は Expo SDK を使用したクロスプラットフォームの音声クイズアプリです。

### 主要技術スタック

- **React Native** + **Expo SDK 54** - クロスプラットフォーム開発
- **TypeScript** - 型安全性
- **NativeWind** (Tailwind CSS) - スタイリング
- **Supabase** - データベース + リアルタイム通信
- **Zustand** - 軽量状態管理
- **expo-speech** - 音声合成

### 核となるアーキテクチャパターン

#### 1. レイヤー分離アーキテクチャ

```
app/                    # Expo Router画面
├─ components/          # UIコンポーネント
├─ services/           # データアクセス層
├─ hooks/              # ビジネスロジック
├─ utils/              # 純粋関数
├─ stores/             # 状態管理
└─ contexts/           # React Context
```

#### 2. サービス層パターン (`services/supabaseService.ts`)

全てのデータベース操作は`SupabaseService`クラスに集約：

```typescript
// コンポーネントで直接supabaseを呼ばない
await SupabaseService.createRoom(code, userId, quizMode);
```

#### 3. カスタムフック (`hooks/`)

- `useQuizData` - クイズ状態、リアルタイム更新
- `useRoomData` - ルーム状態、参加者管理
- `useRealtimeSubscription` - Supabase リアルタイム購読

## 重要な開発パターン

### リアルタイム通信

```typescript
// ポーリング + リアルタイム購読のハイブリッド
const { connectionState } = useRealtimeSubscription({
  channelName: `quiz-${roomId}`,
  onConnected: () => console.log('Connected'),
});
```

### 状態管理

- **ローカル状態**: `useState` + カスタムフック
- **グローバル状態**: Zustand (`stores/userStore.ts`)
- **ヘッダー設定**: Context API (`contexts/HeaderSettingsContext.tsx`)

### スタイリングパターン

```tsx
// NativeWind + カスタムカラーシステム
<View className="bg-app-primary-light rounded-lg p-4">
  <Button variant="primary" size="medium" />
</View>
```

カスタムカラー: `app-primary`, `app-success`, `app-danger` など (`tailwind.config.js`)

### エラーハンドリング

```typescript
// サービス層でエラーを統一
try {
  await SupabaseService.submitAnswer(roomId, userId, questionId, text);
} catch (err: any) {
  setError(err.message || 'デフォルトエラーメッセージ');
}
```

## 重要なビジネスロジック

### クイズモード

- **`all-at-once-host`**: ホストが問題作成・判定
- **`all-at-once-auto`**: 事前登録例文で自動判定

### 音声機能

```typescript
// expo-speechを使用した音声合成
await Speech.speak(text, {
  language: 'en-US',
  rate: voiceSettings.speed,
  voice: voiceSettings.gender === 'male' ? 'com.apple.voice...' : '...',
});
```

### 回答判定システム

```typescript
// diffUtilsで差分解析 + 閾値による部分点判定
const judgment = getJudgmentResult(userAnswer, correctAnswer);
// 結果: 'correct' | 'partial' | 'incorrect'
```

## 開発ワークフロー

### 起動・テスト

```bash
npm run ios          # iOS Simulator
npm run android      # Android Emulator
npm run web          # Web開発サーバー
npm test            # Jest テスト
```

### ディレクトリ構造の原則

- `components/` - 機能別サブディレクトリ（`quiz/`, `room/`, `common/`）
- `app/` - Expo Router の規約に従ったファイルベースルーティング
- `types/index.ts` - 全型定義を集約

### 新機能追加時のベストプラクティス

1. **型定義**: `types/index.ts`に新しいインターフェース追加
2. **データアクセス**: `SupabaseService`にメソッド追加
3. **ビジネスロジック**: 必要に応じてカスタムフック作成
4. **UI**: 再利用可能なコンポーネントを`components/common/`に配置

### 重要な設定ファイル

- `metro.config.js` - NativeWind 統合
- `tailwind.config.js` - カスタムカラーシステム
- `app.json` - Expo 設定
- `tsconfig.json` - パスエイリアス設定（`@/`）

### デバッグのコツ

- リアルタイム機能: コンソールで接続状態確認
- 音声機能: iOS 実機でテスト（Simulator は音声出力なし）
- スタイリング: NativeWind DevTools でクラス確認

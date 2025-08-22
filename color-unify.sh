#!/bin/bash

# アプリ全体の色を統一するスクリプト

echo "アプリ全体の色を統一しています..."

# Blue系の置換
find app components -name "*.tsx" -exec sed -i '' 's/text-blue-500/text-app-primary/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-blue-600/text-app-primary/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-blue-700/text-app-primary-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-blue-800/text-app-primary-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-blue-50/bg-app-primary-light/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-blue-100/bg-app-primary-light/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-blue-500/bg-app-primary/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/border-blue-200/border-app-primary-light/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/border-blue-400/border-app-primary/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/border-blue-500/border-app-primary/g' {} \;

# Green系の置換
find app components -name "*.tsx" -exec sed -i '' 's/text-green-500/text-app-success/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-green-600/text-app-success-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-green-700/text-app-success-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-green-100/bg-app-success-light/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-green-500/bg-app-success/g' {} \;

# Red系の置換
find app components -name "*.tsx" -exec sed -i '' 's/text-red-500/text-app-danger/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-red-600/text-app-danger/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-red-700/text-app-danger-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-red-800/text-app-danger-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-red-100/bg-app-danger-light/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-red-500/bg-app-danger/g' {} \;

# Yellow/Orange系の置換
find app components -name "*.tsx" -exec sed -i '' 's/text-yellow-600/text-app-warning/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-yellow-700/text-app-warning-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-yellow-800/text-app-warning-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-yellow-100/bg-app-warning-light/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-orange-500/text-app-orange/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-orange-700/text-app-orange-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-orange-800/text-app-orange-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-orange-100/bg-app-orange-light/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-orange-500/bg-app-orange/g' {} \;

# Purple系の置換
find app components -name "*.tsx" -exec sed -i '' 's/text-purple-700/text-app-purple-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/text-purple-800/text-app-purple-dark/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-purple-100/bg-app-purple-light/g' {} \;
find app components -name "*.tsx" -exec sed -i '' 's/bg-purple-500/bg-app-purple/g' {} \;

echo "色の統一が完了しました！"

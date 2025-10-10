# Angular 20 + TailwindCSS + PrimeNG SPA 環境構築ロードマップ

## 🎯 概要
Angular 20をベースに、TailwindCSS + PrimeNGを組み合わせたモダンなSPA環境を構築し、AWS Amplifyでデプロイするまでの手順書です。パッケージマネージャーにはpnpmを使用します。

---

## 📋 前提条件
- Node.js 18.x以上
- pnpm 8.x以上
- Git
- AWS アカウント（デプロイ時）

---

## 🚀 セットアップ手順

### 1. プロジェクト初期化

```bash
# pnpmのインストール（未インストールの場合）
npm install -g pnpm

# Angularプロジェクト作成
pnpm dlx @angular/cli@20 new your-project-name --package-manager pnpm --style css --ssr false --routing true

cd your-project-name
```

**チェックポイント:**
- ✅ `package.json`が作成されている
- ✅ `angular.json`にpnpmが指定されている
- ✅ `src/`ディレクトリが存在する

---

### 2. TailwindCSS セットアップ

```bash
# TailwindCSS関連パッケージのインストール
pnpm add -D tailwindcss postcss autoprefixer
```

**src/styles.css を編集:**
```css
/* You can add global styles to this file, and also import other style files */
@import "tailwindcss";
```

**チェックポイント:**
- ✅ `tailwindcss`がdevDependenciesに追加されている
- ✅ `src/styles.css`にTailwindのimportが記述されている

**動作確認:**
```bash
pnpm start
```
開発サーバーが起動し、`http://localhost:4200`でアクセスできることを確認。

---

### 3. PrimeNG セットアップ

```bash
# PrimeNGとアイコンパッケージのインストール
pnpm add primeng primeicons
```

**angular.json を編集:**
`styles`配列にPrimeIconsを追加:
```json
"styles": [
  "node_modules/primeicons/primeicons.css",
  "src/styles.css"
]
```

**チェックポイント:**
- ✅ `primeng`と`primeicons`がdependenciesに追加されている
- ✅ `angular.json`の`styles`にprimeicons.cssが含まれている

**サンプルコンポーネントで動作確認:**
```typescript
// app.ts
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="p-4">
      <p-button label="PrimeNG Button" icon="pi pi-check" class="bg-blue-500"></p-button>
    </div>
  `
})
export class AppComponent {}
```

---

### 4. ビルド確認

```bash
# プロダクションビルド
pnpm run build

# ビルド成果物の確認
ls -la dist/your-project-name/browser
```

**チェックポイント:**
- ✅ `dist/`ディレクトリが生成されている
- ✅ エラーなくビルドが完了している

---

## 🌐 AWS Amplifyデプロイ

### 5. Amplify設定ファイル作成

プロジェクトルートに`amplify.yml`を作成:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install
    build:
      commands:
        - pnpm run build
  artifacts:
    baseDirectory: dist/your-project-name/browser
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**チェックポイント:**
- ✅ `amplify.yml`がプロジェクトルートに存在する
- ✅ `baseDirectory`がビルド出力先と一致している

---

### 6. GitHubリポジトリ準備

```bash
# Gitリポジトリ初期化（未初期化の場合）
git init
git add .
git commit -m "Initial commit: Angular 20 + TailwindCSS + PrimeNG setup"

# GitHubリポジトリと連携
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

---

### 7. AWS Amplifyでデプロイ

**手順:**

1. **AWS Amplifyコンソールにアクセス**
   - https://console.aws.amazon.com/amplify/

2. **新しいアプリケーション作成**
   - 「ホストWeb アプリケーション」を選択
   - GitHubを選択して認証

3. **リポジトリとブランチを選択**
   - 対象リポジトリとブランチ（main）を選択

4. **ビルド設定**
   - 自動検出された`amplify.yml`を確認
   - 必要に応じて環境変数を設定

5. **デプロイ**
   - 「保存してデプロイ」をクリック
   - 自動ビルド＆デプロイが開始

**チェックポイント:**
- ✅ ビルドが成功している
- ✅ デプロイされたURLにアクセスできる
- ✅ 自動デプロイが有効になっている

---

## 📦 パッケージ構成

### 主要パッケージ

| パッケージ | バージョン | 用途 |
|----------|----------|------|
| @angular/core | 20.x | Angularコアフレームワーク |
| primeng | 20.x | UIコンポーネントライブラリ |
| primeicons | 7.x | アイコンセット |
| tailwindcss | 4.x | ユーティリティファーストCSS |

---

## 🔧 開発コマンド

```bash
# 開発サーバー起動
pnpm start

# プロダクションビルド
pnpm run build

# テスト実行
pnpm test

# リント実行
pnpm lint
```

---

## 🎨 スタイリング方針

### TailwindCSS + PrimeNGの併用
- **レイアウト・スペーシング**: TailwindCSSのユーティリティクラス使用
- **UIコンポーネント**: PrimeNGコンポーネント使用
- **カスタムスタイル**: 必要に応じてTailwindで上書き

**例:**
```html
<div class="container mx-auto p-4">
  <p-button
    label="Submit"
    class="mt-4 w-full"
    severity="primary">
  </p-button>
</div>
```

---

## 🚨 トラブルシューティング

### ビルドエラーが出る場合
```bash
# node_modules削除して再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TailwindCSSが効かない場合
- `src/styles.css`のimport文を確認
- ブラウザキャッシュをクリア

### PrimeNGコンポーネントが表示されない場合
- `angular.json`のstyles設定を確認
- コンポーネントのimportを確認

---

## 📚 参考リンク

- [Angular 公式ドキュメント](https://angular.dev)
- [TailwindCSS 公式ドキュメント](https://tailwindcss.com)
- [PrimeNG 公式ドキュメント](https://primeng.org)
- [AWS Amplify 公式ドキュメント](https://docs.amplify.aws)

---

## ✅ デプロイチェックリスト

- [ ] ローカルでビルドが成功する
- [ ] TailwindCSSが正しく適用されている
- [ ] PrimeNGコンポーネントが表示される
- [ ] GitHubリポジトリにコミット済み
- [ ] `amplify.yml`が正しく設定されている
- [ ] AWS Amplifyでビルドが成功
- [ ] デプロイURLで動作確認完了
- [ ] 自動デプロイが動作している

---

**🎉 これで完了！mainブランチへのpushで自動的にデプロイされるようになります！**
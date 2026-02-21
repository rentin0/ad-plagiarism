# Angular + RxJS 練習課題

Angular 21 / RxJS を用いて、  
Observable の基本制御を一通り体験するための課題。

外部APIは以下を使用する（叩き放題）：

- https://jsonplaceholder.typicode.com/users  
- https://jsonplaceholder.typicode.com/posts?userId=1  

---

## 🎯 テーマ
**ユーザー検索 & 投稿閲覧アプリ**

---

# 🥉 Lv1：Observable基礎

## 課題1：ユーザー一覧取得

### 要件
- 初期表示時に `/users` を取得
- ユーザー名を一覧表示

### 制約
- `subscribe` は component.ts に最大1回まで
- テンプレートでは `| async` を使う

### 期待する構成例
- `users$ : Observable<User[]>`

---

## 課題2：ローディング表示

### 要件
- 通信中は「Loading...」を表示
- 完了したら非表示

### 使用推奨
- `tap`
- `startWith`
- `finalize`

---

# 🥈 Lv2：イベント × RxJS

## 課題3：検索フィルタ

### UI
- input box

### 要件
- 入力された文字でユーザー名をフィルタ
- 入力後 300ms 待ってから処理

### 使用推奨
- `FormControl`
- `valueChanges`
- `debounceTime`
- `map`
- `combineLatest`

---

## 課題4：ユーザー選択 → 投稿取得

### 要件
- ユーザークリックで投稿取得
- `/posts?userId=xx` を呼ぶ

### 使用推奨
- `Subject` or `BehaviorSubject`
- `switchMap`

---

# 🥇 Lv3：RxJSらしい制御

## 課題5：多重クリック対策

### 要件
- ユーザー連打時
  - 前の通信をキャンセル
  - 最新の通信のみ有効

### 使用推奨
- `switchMap`

---

## 課題6：エラーハンドリング

### 要件
- 通信失敗時：
  - 「通信に失敗しました」と表示
  - アプリは継続動作

### 使用推奨
- `catchError`
- `of`

---

## 課題7：購読のライフサイクル

### 要件
- `subscribe`は極力書かない
- 書く場合：
  - `takeUntilDestroyed` を使用

---

# 🧠 ゴール

この課題を終えた時点で理解しているべき内容：

- Observable と Promise の違い
- `$` 命名規則の意味
- `switchMap` の役割
- `async` pipe
- `debounce`
- `combineLatest`
- エラーハンドリング
- 通信キャンセル

---

# 🧩 雛形例（参考）

```ts
users$!: Observable<User[]>;
posts$!: Observable<Post[]>;

searchControl = new FormControl('');
selectedUserId$ = new BehaviorSubject<number | null>(null);
```
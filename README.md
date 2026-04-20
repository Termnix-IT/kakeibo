# Kakeibo

Kakeibo は、ブラウザ内の IndexedDB にデータを保存するローカルファーストの家計管理アプリです。バックエンドを持たず、収支入力、月次確認、レポート分析、各種設定を 1 つの Web アプリで完結できます。

## 特徴

- 収入・支出の登録、編集、削除
- 月別の明細一覧とカレンダービュー
- キーワード、種別、カテゴリ、金額帯での絞り込み
- 直近の収支推移とカテゴリ別支出の可視化
- 月次予算の設定と予算アラート
- 固定費の登録と当月への一括適用
- 貯蓄目標の管理
- JSON バックアップ / リストア
- 銀行 CSV インポート
- ダークモードとブラウザ通知

## 画面構成

- `Dashboard`
  - 今月の収支サマリー
  - 直近 6 か月の収支チャート
  - カテゴリ別支出の内訳
  - 予算進捗と貯蓄目標
- `TransactionList`
  - 月別の明細一覧
  - カレンダービュー
  - 検索 / フィルター
  - 繰越残高の確認
  - 固定費の当月適用
- `Report`
  - 月次・年次の推移分析
  - カテゴリ別支出ランキング
  - CSV エクスポート
- `Settings`
  - カテゴリ管理
  - 固定費管理
  - 月次予算設定
  - 貯蓄目標管理
  - 通知 / 表示設定
  - JSON / CSV の入出力

## 技術スタック

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Dexie 4 + `dexie-react-hooks`
- Recharts
- Lucide React

## データ保存

- すべてのアプリデータはブラウザの IndexedDB に保存されます
- サーバーへの送信や外部バックエンドへの依存はありません
- データベースのエントリポイントは [src/db.ts](C:/Users/lugep/デスクトップ/Google%20Drive/ProjectFolder/kakeibo/src/db.ts) です
- 現在の schema version は `4` です

主なテーブル:

- `transactions`
- `categories`
- `budgets`
- `fixedCosts`
- `goals`

## セットアップ

```bash
npm install
npm run dev
```

開発サーバー起動後、表示された URL をブラウザで開いて利用します。通常は `http://localhost:5173/` です。

開発サーバーを停止する場合は、実行中のターミナルで `Ctrl + C` を押します。

## 利用可能なコマンド

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## 補足

- データはブラウザの IndexedDB に保存されます
- 同じブラウザ・同じ PC で開いた場合は、以前のデータを引き継ぎます
- 別のブラウザや別の PC へ移す場合は JSON バックアップ / リストアを利用してください

## プロジェクト構成

```text
src/
├── App.tsx
├── db.ts
├── types.ts
├── components/
├── hooks/
├── pages/
└── utils/
```

詳細な実装メモは [Report.md](C:/Users/lugep/デスクトップ/Google%20Drive/ProjectFolder/kakeibo/Report.md) に残しています。README は公開向けの概要、`Report.md` は開発記録として扱う想定です。

## ライセンス

MIT License  
詳細は [LICENSE](C:/Users/lugep/デスクトップ/Google%20Drive/ProjectFolder/kakeibo/LICENSE) を参照してください。

# みらいオフィス

子ども向けの長期投資学習Webアプリです。仮想口座の積立や値動きを、正確な金額、会社・社会の架空ニュース、働くキャラクターを通じて表現します。

MVP要件は2026-08-22に確定しました。現在はPixel Agentsの画面移植スパイクを進めています。

## 文書

- [コンセプト](concept.md)
- [MVP要件](requirements.md)
- [セキュリティ方針](security-policy.md)
- [Pixel Agents調査](pixel-agents-research.md)
- [こどもNISA制度メモ](child-nisa-research.md)
- [MVP開発ロードマップ](mvp-roadmap.md)
- [Pixel Agentsベースライン検証](baseline.md)
- [画面移植スパイク設計メモ](architecture-spike.md)
- [仮想商品価格シナリオ](price-scenarios.md)
- [仮想口座・画面接続スパイク](virtual-account-spike.md)

## 現在地

Canvas描画、キャラクター状態機械、経路探索の依存関係を確認し、Viteのローカル試作で固定JSONから3人を投入できる状態です。30日価格シナリオ3本、メモリ上の仮想口座、子ども・保護者画面の明示的な切替も実装済みです。子ども画面には元本・評価額・損益と、会社・社会に関する架空ニュースを表示します。積立ごとに仲間が1人ずつ増え、最大3人のチームになります。次は投資履歴と長期推移です。証券APIへの接続や実データの利用は、初期MVPの対象外です。

企画文書とPixel Agents由来のコードは、`/Users/taka-m2/Documents/Codex/mirai-office` の単一Gitリポジトリで管理する。公式リポジトリは `upstream`、GitHub上のフォーク `urapy/pixel-agents` は `origin` とし、みらいオフィスの変更は `codex/mirai-office-mvp` ブランチで進める。

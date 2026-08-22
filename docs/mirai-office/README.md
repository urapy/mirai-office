# みらいオフィス

子ども向けの長期投資学習Webアプリです。仮想口座の積立や値動きを、働くキャラクター、オフィスの天気、建物や植物の成長として表現します。

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

## 現在地

Canvas描画、キャラクター状態機械、経路探索の依存関係を確認し、Viteのローカル試作で固定JSONから3人を投入できる状態です。次は目視確認と、30日価格シナリオから天気・長期成長表現を作るスパイクです。証券APIへの接続や実データの利用は、初期MVPの対象外です。

企画文書とPixel Agents由来のコードは、`/Users/taka-m2/Documents/Codex/mirai-office` の単一Gitリポジトリで管理する。公式リポジトリは `upstream`、GitHub上のフォーク `urapy/pixel-agents` は `origin` とし、みらいオフィスの変更は `codex/mirai-office-mvp` ブランチで進める。

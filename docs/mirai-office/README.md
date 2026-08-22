# みらいオフィス

子ども向けの長期投資学習Webアプリです。仮想口座の積立や値動きを、働くキャラクター、オフィスの天気、建物や植物の成長として表現します。

MVP要件は2026-08-22に確定しました。現在はPixel Agents未変更版の起動確認と画面移植スパイクの準備段階です。

## 文書

- [コンセプト](concept.md)
- [MVP要件](requirements.md)
- [セキュリティ方針](security-policy.md)
- [Pixel Agents調査](pixel-agents-research.md)
- [こどもNISA制度メモ](child-nisa-research.md)
- [MVP開発ロードマップ](mvp-roadmap.md)

## 現在地

次の作業は、Pixel Agents未変更版を起動し、`webview-ui`、Canvas描画、キャラクター状態の依存関係を確認することです。証券APIへの接続や実データの利用は、初期MVPの対象外です。

企画文書とPixel Agents由来のコードは、`/Users/taka-m2/Documents/Codex/mirai-office` の単一Gitリポジトリで管理する。公式リポジトリは `upstream`、GitHub上のフォーク `urapy/pixel-agents` は `origin` とし、みらいオフィスの変更は `codex/mirai-office-mvp` ブランチで進める。

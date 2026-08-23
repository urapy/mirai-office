# みらいオフィス

子ども向けの長期投資学習Webアプリです。仮想口座の積立や値動きを、正確な金額、会社・社会の架空ニュース、働くキャラクターを通じて表現します。

MVP要件は2026-08-22に確定しました。現在は仮想口座・リアルタイム市場・ピクセルオフィスを接続する縦切り実装を進めています。

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
- [仮想証券口座・リアルタイム市場アーキテクチャ](realtime-brokerage-architecture.md)

## 現在地

Canvas描画、キャラクター状態機械、経路探索を移植し、3つの架空商品へ積み立てると対応する仲間が出勤する状態です。ローカルの仮想市場APIが再現可能な価格を1秒ごとに配信し、保護者向け仮想証券口座と子ども向けみらいオフィスが同じ口座状態を表示します。API停止時は30日固定シナリオのローカルデモへ切り替わります。外部の証券会社APIへの接続や実データの利用は、初期MVPの対象外です。

企画文書とPixel Agents由来のコードは、`/Users/taka-m2/Documents/Codex/mirai-office` の単一Gitリポジトリで管理する。公式リポジトリは `upstream`、GitHub上のフォーク `urapy/pixel-agents` は `origin` とし、みらいオフィスの変更は `codex/mirai-office-mvp` ブランチで進める。

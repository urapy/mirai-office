# みらいオフィス

[English](README.en.md)

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
- [Firebaseデプロイ設計](firebase-deployment.md)
- [iPhoneからのリモート確認](remote-preview.md)
- [業績イベントと仕事コンディション](performance-events.md)
- [NVIDIA企業ウォッチ試験版](company-watch-nvidia.md)

## 現在地

Canvas描画、キャラクター状態機械、経路探索を移植し、保護者向け仮想証券口座で金融・IT・産業の架空商品へ積み立てると、みらいオフィスの業種別ルームへ架空企業3社の仲間が出勤する状態です。ローカルの仮想市場APIが再現可能な価格と会社・チームの架空仕事イベントを配信し、2画面が同じ口座状態を表示します。積立と確認付き初期化は仮想証券口座へ集約し、みらいオフィスは洗練された読み取り専用サマリーとして表示します。音符と汗は価格や画面タイマーではなく、仕事イベントの内容をトリガーにします。

実在企業を扱う独立した試験機能として、NVIDIA公式Newsroomの最新発表を分類し、子ども向けに説明するAIコンピューティングラボを追加しています。NVIDIAは仮想商品の購入対象にせず、株価予測や売買推奨も行いません。外部の証券会社APIや実口座との接続は、初期MVPの対象外です。

企画文書とPixel Agents由来のコードは、みらいオフィス専用の単一Gitリポジトリで管理します。みらいオフィスのGitHubリポジトリを `origin`、Pixel Agents公式リポジトリを `upstream`、GitHub上のPixel Agentsフォークを `pixel-agents-fork` とし、開発変更は `codex/mirai-office-mvp` ブランチで進めます。

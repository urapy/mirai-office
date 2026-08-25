# みらいオフィス

[English](docs/mirai-office/README.en.md)

子どもが長期投資を「自分のお金が社会の中で働くこと」として体験するためのWebアプリです。保護者が仮想証券口座を管理し、子どもはピクセルアートのオフィスを通じて、会社・社会・時間と投資のつながりを学びます。

[Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents)をベースに、Canvas描画、キャラクター状態機械、経路探索、オフィス編集機能を活用しています。

## 現在の試作版

- 完全な仮想口座と再現可能なリアルタイム価格
- 子ども画面と保護者画面の分離
- 金融・IT・産業の架空ファンドと業種別ルーム
- 会社イベントに連動して働き、移動し、反応するキャラクター
- スマートフォン対応
- NVIDIA公式発表を子ども向けに説明する企業ウォッチ試験機能

NVIDIAは仮想商品の購入対象には含めません。企業ウォッチは株価予測、企業ランキング、売買推奨を行わず、「何があったか」「子どもの言葉では」「次に見守ること」を公式情報へのリンクとともに表示します。

## ローカル起動

Node.js 20以降とnpmが必要です。

```bash
npm install
npm run dev:mirai
```

- みらいオフィス: `http://127.0.0.1:5173/`
- 保護者向け仮想証券口座: `http://127.0.0.1:5174/`
- ローカル仮想市場API: `http://127.0.0.1:4310/`

Firebase Functionsは任意のデプロイ試作であり、ローカル開発には必要ありません。従量課金が発生し得るため、明示的な承認なしにFirebaseのビルドやデプロイを行わない方針です。

## ドキュメント

- [プロジェクト概要](docs/mirai-office/README.md)
- [コンセプト](docs/mirai-office/concept.md)
- [MVP要件](docs/mirai-office/requirements.md)
- [セキュリティ方針](docs/mirai-office/security-policy.md)
- [NVIDIA企業ウォッチ試験版](docs/mirai-office/company-watch-nvidia.md)

## ライセンスと帰属

ベースとなるPixel Agentsは[MIT License](LICENSE)で提供されています。公開前に、利用する素材のライセンスと実在企業の商標利用を改めて確認します。

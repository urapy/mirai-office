# iPhoneからのリモート確認

更新日: 2026-08-25

## 目的

Mac miniで動く開発版のみらいオフィスと仮想証券口座を、同じTailscaleネットワークに接続したiPhoneから確認する。一般のインターネットには公開しない。

## URL

- みらいオフィス: `https://mac-mini.tailac1e76.ts.net/`
- 仮想証券口座: `https://mac-mini.tailac1e76.ts.net:8443/`

## 構成

開発画面はMacのループバックアドレスだけで待ち受ける。Tailscale ServeがHTTPSを終端し、みらいオフィスをポート5183、仮想証券口座をポート5184へ転送する。両Viteサーバーの`/api/**`は、ローカルの仮想市場API（ポート4310）へ転送する。

これによりブラウザから見た画面とAPIは同一オリジンとなり、Macの`127.0.0.1`をiPhoneから直接参照しない。Firebaseや実在する口座情報は使用しない。

## 起動

```bash
npm run dev:remote
tailscale serve --bg --https=443 http://127.0.0.1:5183
tailscale serve --bg --https=8443 http://127.0.0.1:5184
```

すでに仮想市場APIが動いている場合は、2つの画面だけ個別に起動できる。

```bash
npm run dev:office:remote
npm run dev:brokerage:remote
```

## 終了

開発サーバーを終了した後、共有設定を削除する。

```bash
tailscale serve reset
```

Tailscaleへ接続していない端末からはアクセスできない。開発用Viteサーバーなので、正式公開には使用しない。

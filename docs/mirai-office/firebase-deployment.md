# Firebaseデプロイ設計

更新日: 2026-08-24

## 公開URL

- 子ども向けみらいオフィス: `https://mirai-office-urapy-2026.web.app`
- 保護者向け仮想証券口座: `https://mirai-account-urapy-2026.web.app`
- API: 両サイトの同一オリジンにある `/api/**`。Firebase HostingからCloud Functionsへ転送する。

FirebaseプロジェクトIDは `mirai-office-urapy-2026` とする。2サイトは同じFirebaseプロジェクトのFirestoreとAuthenticationを共有する。

## 構成

| コンポーネント | Firebaseサービス                    | 役割                                               |
| -------------- | ----------------------------------- | -------------------------------------------------- |
| みらいオフィス | Hosting                             | ピクセルオフィス、読み取り専用口座サマリー         |
| 仮想証券口座   | Hosting                             | 積立、リセット、チャート、履歴                     |
| `api`          | Cloud Functions for Firebase第2世代 | 架空価格、仕事イベント、仮想口座REST API           |
| 仮想口座       | Cloud Firestore                     | 元本、架空保有数量、積立履歴の永続化               |
| 保護者ログイン | Firebase Authentication             | 積立とリセットをGoogleログイン済み利用者だけに許可 |

## リアルタイム更新

Firebase HostingからFunctionsへの要求は60秒でタイムアウトするため、クラウド版では長時間のSSEを使わない。両画面が1秒ごとに短いREST要求を送り、価格、口座、仕事イベントを更新する。

価格はサーバーの常駐タイマーではなく、UTC時刻と固定シードから決定的に計算する。Functionsが休止または再起動しても、同じ時刻には同じ価格を返す。口座変更はFirestoreトランザクションで直列化する。

## 認証とデータ境界

- 価格、商品、仕事イベント、架空口座の合計値は読み取り可能とする。
- 積立とリセットのPOST APIはFirebase IDトークンを検証する。
- GoogleのパスワードはアプリやFirestoreへ渡らない。
- アプリはIDトークン、メールアドレス、表示名をFirestore、ログ、`localStorage`へ保存しない。
- Firestore Security Rulesはクライアントからの直接読み書きを全面拒否し、Admin SDKを使うAPIだけがアクセスする。
- 保存対象は架空の元本、保有数量、原価、最大200件の架空取引履歴だけとする。
- 実在する証券口座、実名、生年月日、口座番号は扱わない。

## 障害時

- API取得に失敗した画面は「更新停止」を表示し、成功済みの最後の画面状態を保持する。
- 1秒ポーリングは前回の要求が完了するまで次の要求を開始しない。
- Functions再起動後もFirestoreの口座は維持する。
- 認証が無効または期限切れの場合、読み取りは継続し、積立とリセットだけを401で拒否する。

## 依存関係と費用

- `firebase`: 保護者画面のGoogleログインに使用。Apache-2.0。
- `firebase-admin`: FunctionsからAuthenticationとFirestoreを利用。Apache-2.0。
- `firebase-functions`: 第2世代HTTPS Functionの定義。MIT。
- Cloud Functions第2世代とArtifact Registryの利用にはBlazeプランが必要。予算アラートを設定し、FirebaseとGoogle Cloudの使用量を監視する。

## デプロイ

保護者画面は、Firebase ConsoleのWebアプリ設定を
`brokerage-ui/.env.production.example` からコピーした
`brokerage-ui/.env.production` に設定する。この実値ファイルはGit管理しない。

```bash
npm run build:firebase
firebase deploy --project mirai-office-urapy-2026
```

事前にFirebase Consoleで次を完了する。

1. プロジェクトをBlazeプランへ変更する。
2. Authenticationのログイン方法でGoogleを有効にする。
3. Google Cloud Billingで月額予算アラートを設定する。

デプロイ後は2サイトから、商品取得、1秒価格更新、積立、リセット、部屋への3キャラクター出勤を確認する。

# 画面移植スパイク設計メモ

更新日: 2026-08-22

## 結論

Pixel AgentsのCanvas描画、キャラクター状態機械、座席割当、経路探索は、Claude/Codex連携から切り離して利用できる。最初の試作ではフォークを維持し、`webview-ui`へ製品中立の登場人物スナップショットを入力する。画面と投資ドメインが固まった後、必要な画面コードだけを独立アプリへ移すか再評価する。

現段階でPixel Agentsのサーバー側`AgentState`へ投資データを詰め込まない。`AgentState`はセッション、JSONL、ツール、権限待ちなどコーディングエージェント固有の情報を多く持つためである。

## 現在のコード地図

| 役割                               | 主なファイル                                          | スパイクでの扱い           |
| ---------------------------------- | ----------------------------------------------------- | -------------------------- |
| React画面の組立                    | `webview-ui/src/App.tsx`                              | 当面再利用                 |
| 通信メッセージから画面状態への反映 | `webview-ui/src/hooks/useExtensionMessages.ts`        | 製品用境界を追加           |
| Canvasのライフサイクルと入力       | `webview-ui/src/office/components/OfficeCanvas.tsx`   | 再利用候補                 |
| オフィス全体の状態                 | `webview-ui/src/office/engine/officeState.ts`         | 再利用候補                 |
| キャラクター状態機械               | `webview-ui/src/office/engine/characters.ts`          | 再利用候補                 |
| 毎フレーム更新                     | `webview-ui/src/office/engine/gameLoop.ts`            | 再利用候補                 |
| Canvas 2D描画                      | `webview-ui/src/office/engine/renderer.ts`            | 再利用候補                 |
| タイルと幅優先経路探索             | `webview-ui/src/office/layout/tileMap.ts`             | 再利用候補                 |
| Vite単独試作のデータ投入           | `webview-ui/src/browserMock.ts`                       | ローカルスパイクだけで使用 |
| WebSocket/VS Code通信              | `webview-ui/src/transport/`                           | MVPでは縮小候補            |
| Claudeフック、セッション監視       | `server/src/providers/`、`server/src/agentRuntime.ts` | MVP製品から除外候補        |

## 現在のイベントフロー

```text
Claudeフック / JSONL
        ↓
server AgentStateStore
        ↓ WebSocket または VS Code postMessage
useExtensionMessages
        ↓
OfficeState
        ↓
gameLoop → renderer → Canvas
```

描画系は`OfficeState`より下にまとまっている。最も強い結合は、通信メッセージを直接`OfficeState`へ適用する`useExtensionMessages`にある。

## 追加したスパイク境界

ローカルVite試作時だけ、次の流れで固定3キャラクターを投入する。

```text
public/mirai-office/demo-office.json
        ↓ 入力検証
OfficeActorSnapshot
        ↓ officeActorsLoaded
useExtensionMessages
        ↓ addAgent / setAgentActive
OfficeState → 既存Canvas描画
```

`OfficeActorSnapshot`が持つ情報は、ID、子ども向け表示名、色、活動状態だけである。Claude/Codexのセッション、ツール名、権限、ログの概念を含まない。固定データでは3つの架空商品名をキャラクターの表示名とし、全員を`working`としているため、相場の上下とキャラクターの幸福・失敗を結び付けない原則にも合う。

このイベントはまだ正式なサーバープロトコルへ追加していない。画面移植可能性を確かめるローカルスパイクに限定し、価格シナリオと画面設計を確定した後に正式な投資イベントへ置き換える。

## 実装結果

- 固定JSONの形式検証を追加した。
- Vite開発モードで、レイアウト読込後に固定3人を投入する。
- 既存の`agentCreated`、`agentStatus`、Claude/Codexイベントは固定3人の生成に使わない。
- `npm run build`が成功した。
- Webviewは11ファイル、88テストが成功した。追加分は固定スナップショットの正常系と重複ID拒否の2テスト。
- `http://127.0.0.1:5173/mirai-office/demo-office.json`のHTTP配信を確認した。
- 自動目視確認は、ディレクトリ改名前のパスを保持するブラウザ操作環境の起動エラーにより保留した。

## 次のスパイク

1. 新しいCodexスレッドまたはブラウザ操作環境で、3人、家具、ラベルを目視確認する。
2. 実装済みの30日価格シナリオ、口座数値、架空ニュースをスパイク入力へ接続する。
3. 実装済みのチーム成長状態を投資履歴と長期推移へ接続する。
4. `OfficeActorSnapshot`とチーム成長状態だけでCanvasを更新する構成を維持する。
5. 子ども画面に不要なエージェント操作UIを隠し、画面移植後の最小依存を計測する。

## 判断ゲートの暫定評価

現時点では「フォーク継続」が妥当である。3人の投入に描画エンジンの変更は不要だった。ただし、正式MVPまでPixel Agentsのサーバー全体を残す判断ではない。口座数値、架空ニュース、チーム成長表現と子ども画面の静的設計まで確認した時点で、`webview-ui/src/office/`中心の画面移植案と再比較する。

素材は引き続き外部公開しないローカル試作に限定する。公開前の権利確認または素材交換は未完了である。

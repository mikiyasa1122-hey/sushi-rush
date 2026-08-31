# SUSHI RUSH

60秒で注文どおりの寿司を握る、React + TypeScript製のオフライン対応PWAゲームです。

## 開発と検証

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm exec playwright install webkit
pnpm test:e2e
```

## オフラインAPI

設定とローカルランキングは、ブラウザ内で動くHono APIを通して読み書きします。Zodが入力を検証し、外部サーバーへの通信は行いません。初回読み込み後はService Workerによりオフラインでもプレイできます。

## モバイルの音声と入力

効果音はWeb Audio APIで生成し、EffectでiOSの`AudioContext`アンロック完了と失敗を処理します。「Hey Omachi!」は注文を完成させたタップと同じ処理内で音声合成へ渡します。操作ボタンはPointer Eventsとキーボードの両方に対応し、タッチ後に発生する互換`click`の二重入力を防ぎます。

PlaywrightではPixel相当のChromiumとiPhone相当のWebKitで、連打・一時停止/再開・縦横画面を検証します。

`main`への更新でGitHub Actionsが自動ビルドし、GitHub Pagesへ公開します。

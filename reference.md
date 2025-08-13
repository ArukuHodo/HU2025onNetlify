# 参考リンク集
 ## GitHub
 - [HU2025onNetlify](https://github.com/ArukuHodo/HU2025onNetlify)  
   説明：このリポジトリはアプリ開発に向け私が編集しているものです

 - [KU1025onNetlify](https://github.com/KU1025organization/KU1025onNetlify)  
   説明：このリポジトリはHU2025onNetlify生成において参考にしコピペしたリポジトリです

 - [KU1025sources](https://github.com/KU1025/KU1025sources)  
  説明：京都大学の過去問サイト．HU2025作成におけるモデルとなるもの

  説明：私が現在リポジトリHU2025onNetlifyを用いて開発しようとしている北海道大学の過去問サイト．
## 運営
- [Twitter](https://x.com/ExamHu2025)
  説明：HU2025運営用ツイッターアカウント

- [mail_o](hu2025.exam@gmail.com)
  説明：HU2025運営用メールアドレス

## driveフォルダId
- folderIdGeneral：1uYNf8Od23k2wLHCRwDZwEchcqVq560bn
- folderIdLiterature：1YlreDAHum_hOs2PDFAZmycywyF6mdyQD
- folderIdEngineering：1JmkiFgUu_AGvfmssapZER0v209lUhP4C


## 目的
### KU1025との類似点
## サイト構造と自動化メモ（2025/8/11追記）

- 学部・学科レベルのカテゴリページ（例：全学共通科目.html、工学部専門科目.html）は手動で作成・管理する。
- 各講義名ごとのページや、その中の年度・問題リストはGAS（Google Apps Script）等で自動生成するのが効率的。
- 例：
  - 学部/学科ページ：手動
  - 講義名・試験年度ページやリスト：GAS等で自動化

この役割分担により、サイト構造の柔軟性とデータ更新の自動化を両立できる。
- 大学の定期試験の過去問をまとめるサイトの構築
- 工学部だけでなく様々な学部の過去問をまとめる
- 「googledriveにpdfファイルを追加→GitHub上にhtmlファイルの生成→ページ上にそのpdf用のリンクが追加」の流れを自動化
- 

### KU1025と異なる点
- サイト内の関連リンクに「教科書一覧」のリンクを設置し，そのリンク内にアマゾンアフィリエイト用のリンクを設置することで収益化

---

## HU2025onNetlify 開発優先順位・アクションプラン（2025/8/11時点）

### 最優先 (P0: 今日着手)
1. ブランド/表記差し替え（KU→HU, 京大→北大 など）
2. 空の textbooks.html の骨格作成（説明・カテゴリ・アフィリエイトID変数化）
3. Google Apps Script 設定の洗い出し（properties キーを HU 用に再定義）
4. 自動生成スクリプトの汎用化準備（commitメッセージ接頭辞定数化、置換語リスト化）
5. ライセンス/出典確認（READMEに由来と変更点を明記）

### 高優先 (P1: 今週)
6. 教科書データ投入方式決定（JSON静的 or GAS/スプレッドシート）
7. textbooks.js でJSON読み込み・動的描画
8. Amazonアフィリエイト要件対応（表記・リンク属性）
9. SEOとアクセシビリティ改善（meta description, セマンティクス）
10. アップロード導線修正（説明・命名規則HU化）
11. _redirects のHU用整備

### 中優先 (P2: 今月)
12. 自動更新ロジック改善（閾値定数化、コミット単位分割）
13. 例外/失敗時通知（GmailApp.sendEmail等）
14. キャッシュ/パフォーマンス（Netlify Headers）
15. アクセス解析・プライバシーポリシー整備
16. UI改善（サイドバー、モバイル対応）
17. ユニット的検証（正規表現関数化とテスト）

### 低〜後回し (P3: 将来)
18. 多言語化
19. API化（Netlify Functions）
20. CI（HTML lint/リンクチェック）
21. Lighthouse改善

### 即時タスクの具体的チェックリスト (P0詳細)
- [ ] KU→HU 文字列一覧抽出
- [ ] index/pages/upload 3ファイルのブランド差し替え
- [ ] textbooks.html: 基本HTML骨格 + 説明 + script読み込みタグ準備
- [ ] README に派生元記述追加
- [ ] GAS properties 用テンプレ作成
- [ ] github.gs: 定数抽出

### 決定待ち項目
- サイト正式タイトル
- AmazonアソシエイトID
- Googleドライブ 2 ルートフォルダID
- 公開用メールアドレス
- Netlify ドメイン最終形
- プライバシーポリシー/免責文言

### 推奨ファイル追加案
- config.js (GAS用)
- textbooks.json (教科書データ)
- CONTRIBUTING.md
- CHANGELOG.md

### 教科書JSON 推奨最小スキーマ
- category: string
- title: string
- authors: string[]
- isbn: string
- amazonAsin: string
- note: string (任意)
- tags: string[]

### 進め方サンプルフロー
1. 文字列置換 → 差分確認 → commit
2. textbooks.html 雛形 & config.js 追加 → commit
3. README 追記 & GAS properties テンプレ掲載 → commit
4. github.gs リファクタ（定数化）→ commit
5. textbooks.json フォーマット設計 → commit
6. 描画スクリプト追加 → commit
7. アフィリエイト表示・免責文言挿入 → commit


## github.gsコード（2025/8/11時点）

---まず、github.gsの全内容とHU2025onNetlify配下のファイル一覧を取得して、どの部分をHU用に修正すべきかを具体化します。続いて、各セクションごとに修正要否と修正内容を詳細に説明します。 目的を踏まえ、github.gsを先頭から部位ごとに精査し、HU2025で必要な修正の有無と理由・修正案を具体化します。あわせてHU2025onNetlify配下の既存ファイルも参照し、現状に照らして必要性を判定しました。

チェックリスト
- 定数・Script Properties定義の確認/修正
- GitHubAPI依存の確認
- updateIndexPage/updateUploadPageの挙動確認
- updatePagesSpecial/updatePagesGeneralの挙動確認
- makeDescendantPages/updatePageの出力先/しきい値確認
- makeContentsの文言・ハッシュタグ等のHU化
- getFilesIdInのソート仕様確認
- includeの利用テンプレート確認
- レポ内HTMLテンプレートのKU由来表記の洗い出し（参考）

github.gs部位別レビュー（必要修正点を明示）

1) 冒頭のScript Properties取得（1〜13行）
- 現状: githubClientId, githubClientSecret, githubAccessToken, githubUserName, githubRepository, name, email, branchName, siteUrl, folderIdSpecial, folderIdGeneral を取得。
- 必要: コード自体の修正は不要。値の設定がHU用に必須。
  - githubUserName: ArukuHodo
  - githubRepository: HU2025onNetlify
  - branchName: Netlifyが監視するブランチ（本番ならmain、現状はfeature/textbooksだが、Netlify設定に合わせる）
  - siteUrl: https://hu2025.netlify.app/（末尾スラなし推奨）
  - folderIdSpecial/folderIdGeneral: HU用のDriveフォルダIDに更新
  - name/email: HU用のコミッター情報に更新
- 理由: リポジトリ・ブランチ・サイトURL・Drive IDがKUからHUに変わるため。

2) GitHubAPI初期化とブランチ/ツリー取得（15〜19行）
- 現状: new GitHubAPI.GitHubAPI(...), getBranch, getTree。
- 必要: コード修正は不要。ただしGASプロジェクトにGitHubAPIライブラリ/コードが組み込まれていることが前提（このリポには当該定義は含まれていないため、GAS側で追加が必要）。
- 理由: 依存コード未同梱のため。

3) コミットメッセージ用変数（22〜30行）
- 現状: commitMessage/commitMessage2。日本語接頭辞は各更新関数側で付与。
- 必要: 任意。接頭辞や構造を定数化したい場合は改善余地あり。現状のHU運用には必須ではない。

4) updateIndexPage（33〜56行）
- 現状: indexテンプレートを評価してindex.htmlにコミット。メッセージは「yyyy-MM-ddトップ」。
- 必要: コード修正は不要。
- 注意: GASプロジェクト内に index.html テンプレートが必要（リポのindex.htmlは出力物であり、GASのHtmlServiceはGASプロジェクト側のファイルを読む）。HU版の内容に差し替えたテンプレをGASに登録すること。

5) updateUploadPage（59〜82行）
- 現状: uploadテンプレートを評価してupload.htmlにコミット。メッセージは「yyyy-MM-ddアップロード」。
- 必要: コード修正は不要。
- 注意: GAS側に upload.html テンプレが必要。HU版の内容に整合させる。

6) updatePagesSpecial（85〜104行）/ updatePagesGeneral（107〜127行）
- 現状: Drive配下を辿ってpagesを生成。コミットメッセージの接頭辞は「専門」「全学」。
- 必要: コード修正は不要。Script Propertiesの folderIdSpecial/folderIdGeneral の設定がHU用に必須。
- 備考: 親ページ引数 "index.html" は現状のサイト構造（トップへ戻るリンク）に合致。

7) makeDescendantPages（130〜142行）
- 現状: 再帰的にupdatePageを呼ぶ。
- 必要: 変更不要。

8) updatePage（149〜181行）
- 現状: フォルダ名からページ名を生成。「25時間以内に更新された場合のみ」ページ生成し、pTreeに追記。commitMessageにフォルダ名を連結。
- 必要: 変更不要。運用に応じて25時間のしきい値をプロパティ化する改善は任意。
- 注意: HtmlService.createTemplateFromFile('pages') を使うため、GAS側に HU仕様の pages.html テンプレが必要（リポ内のpages.htmlはKU仕様の記述が残っているため、テンプレは必ずHU化すること）。

9) makeContents（188〜226行）← ここは修正必須
- 現状:
  - pageUrl = siteUrl + rootFolderName + '.html'
  - ツイートボタンのURLがKU固定
    - hashtags=KU1025,rootFolderName
    - text=KU1025で
  - リンク本文やクラスはTwitterウィジェットを想定（class="twitter-hashtag-button"）
- 必要: HU化が必須。具体的には以下を置換
  - hashtags=HU2025 に変更
  - text=HU2025で に変更
- 修正案（該当2行の文字列のみ置換）:
  - "hashtags=KU1025," → "hashtags=HU2025,"
  - "text=KU1025で" → "text=HU2025で"
- 理由: プロジェクト名・ハッシュタグの統一。index.html等は@ExamHu2025で統一済みだが、ここだけKUの名残があるため。

10) getFilesIdIn（233〜263行）
- 現状: fileは名前降順、folderは昇順でソート。問題なし。
- 必要: 変更不要。HU要件に合わせてソート仕様変更が必要であればプロパティ化可（任意）。

11) include（270〜275行）
- 現状: HtmlServiceで外部テンプレート読込。css.html読み込み用途。
- 必要: 変更不要。GAS側に css.html が必要（リポにcss.htmlは存在し、HU用スタイルに見合う）。

レポ内ファイル横断の整合性チェック結果（github.gs観点で必要な周辺修正）

- 必須修正（github.gs内）
  - makeContents内のKU→HU置換（ハッシュタグ/テキスト）

- プロパティ必須設定（github.gs外、GAS環境）
  - githubUserName=ArukuHodo
  - githubRepository=HU2025onNetlify
  - branchName=Netlify監視ブランチ（本番想定ならmain）
  - siteUrl=https://hu2025.netlify.app/
  - folderIdSpecial, folderIdGeneral=HU用Drive ID
  - name/email=HU用コミッター情報

- GASテンプレ必須（github.gs外、GAS環境）
  - index.html, upload.html, pages.html, css.html をGASプロジェクトへ配置（HU仕様）
  - 注意: リポ内の pages.html はKU要素（@1025kuexam, ku1025.netlify.app 等）が混在しているため、GASテンプレではHU向けに修正してから配置すること

- リポ内参考メモ
  - index.html の og:url が "https://hu2025.netlify.app//" とスラ重複（軽微な表記修正を推奨、github.gsとは独立）
  - privacy_policy.html / menseki.html / textbooks.html が空なので、今後の自動化出力と整合を取るならGAS管理か手動管理かを決める

まとめ（どこをどの程度直すか）
- github.gsのコード改変は最小でOK。必須は1点のみ
  - makeContents内の文字列「KU1025」→「HU2025」（ハッシュタグとテキストの2箇所）
- それ以外は設定/テンプレ側の対応
  - Script PropertiesのHU化（必須）
  - GAS側テンプレート（index/upload/pages/css）のHU版配置（必須）
  - GitHubAPIライブラリの導入確認（必須）

次アクション提案
- GAS側で「プロパティ設定」と「テンプレ配置」を先に実施
- 続いてgithub.gsのmakeContentsの2箇所をHU2025に置換
- テストとして updatePagesGeneral か updatePagesSpecial を単発実行し、該当フォルダ直下の1ディレクトリだけで試す（25時間条件に注意し、直近更新のあるフォルダで）

要不要判定の要約
- コード変更: 必須（makeContentsのKU→HU）/ 任意（しきい値定数化、コミットメッセージ定数化）
- 設定変更: 必須（Script Properties全体）
- テンプレ変更: 必須（pages含むHU化）
- 依存ライブラリ: 必須（GitHubAPIの導入確認）

不明点があれば、GASプロパティの現値とNetlifyの監視ブランチを教えてください。こちらで差分を詰めた修正案（パッチ）も提示できます。

タスク受領：  
「文学部（例：folderIdLiterature）を追加し、さらに各学部の下に“学科ごとの分別ページ”を作成できるようにgithub.gsを拡張する」ための修正ポイントを、現状コードの部位ごとに詳細に説明します。

---

### チェックリスト

- [ ] 文学部用のScript Properties追加・取得
- [ ] updatePagesLiterature関数の新規追加
- [ ] makeDescendantPages, updatePageの再帰構造の確認（学科分別対応）
- [ ] テンプレート（pages.html等）の学科分別対応
- [ ] 必要な箇所のHU化・汎用化

---

### 1. Script Propertiesの拡張

**現状**  
- folderIdSpecial, folderIdGeneralのみ

**修正内容**  
- GASのScript Propertiesに `folderIdLiterature` を追加し、github.gs冒頭で取得する行を追加
  ```js
  const folderIdLiterature = properties.getProperty('folderIdLiterature');
  ```
- 必要に応じて他学部も同様に追加可能

---

### 2. updatePagesLiterature関数の追加

**現状**  
- updatePagesSpecial, updatePagesGeneral の2関数のみ

**修正内容**  
- 文学部用の関数を新規追加
  ```js
  function updatePagesLiterature(){
    const rootFolderId = folderIdLiterature;
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    makeDescendantPages(rootFolder, "index.html");
    if(commitMessage != ""){
      commitMessage = Utilities.formatDate(new Date(), "JST", "yyyy-MM-dd") + '文学部' + commitMessage2 + commitMessage;
      const data = { 'tree': pTree['tree'] };
      const tree = github.createTree(data);
      const commit = github.createCommit(commitMessage, tree['sha'], branch['commit']['sha']);
      const result = github.updateReference(branchName, commit['sha']);
      Logger.log(result);
    }
    return;
  }
  ```
- 他学部も同様のパターンで関数を追加可能

---

### 3. makeDescendantPages, updatePageの再帰構造

**現状**  
- makeDescendantPagesはフォルダ階層を再帰的に辿り、updatePageで各階層のページを生成

**修正内容**  
- コード自体は既に「学部→学科→科目→ファイル」といった多階層に対応できる再帰構造になっているため、**追加実装は不要**。
- ただし、Drive側のフォルダ構成を「学部フォルダ→学科フォルダ→科目フォルダ→ファイル」としておく必要がある。
- ページタイトルやリンク生成部分で「学科」などの階層名が正しく反映されるか、テンプレート（pages.html）側も確認・調整する。

---

### 4. テンプレート（pages.html等）の学科分別対応

**現状**  
- ページタイトルや戻るリンクなどが「学部」や「科目」単位でしか想定されていない場合がある

**修正内容**  
- テンプレート内で「親ページへのリンク」や「現在の階層名」を柔軟に表示できるようにする
- 例：`parentTitle`や`pageUrl`などの変数を活用し、階層が深くなっても正しく表示されるようにする

---

### 5. その他の注意点

- commitMessageの接頭辞（例：'文学部'）はupdatePagesLiteratureで適切に設定
- 必要に応じて、学部名や学科名をScript PropertiesやDriveのメタデータで管理することも検討
- 他学部追加時も同様のパターンで拡張可能

---

### まとめ

- github.gs冒頭で `folderIdLiterature` を取得
- updatePagesLiterature関数を追加（Special/Generalと同様の構造）
- makeDescendantPages, updatePageは多階層対応済みなので追加実装不要
- テンプレート（pages.html等）で階層表示の柔軟性を確認・調整
- commitMessageやリンク生成のHU化・汎用化も忘れずに

この方針で修正すれば、学部追加・学科分別ページの自動生成に対応できます。具体的なコード例やパッチが必要な場合はご指示ください。

1 種類のライセンスで類似のコードが見つかりました
const properties = PropertiesService.getScriptProperties();
const githubClientId      = properties.getProperty('githubClientId');
const githubClientSecret  = properties.getProperty('githubClientSecret');
const githubAccessToken   = properties.getProperty('githubAccessToken');
const githubUserName      = properties.getProperty('githubUserName');
const githubRepository    = properties.getProperty('githubRepository');
const name                = properties.getProperty('name');
const email               = properties.getProperty('email');
const branchName          = properties.getProperty('branchName');
const pageUpdateThresholdHours = Number(properties.getProperty('pageUpdateThresholdHours') || 25); // 追加

const siteUrl             = properties.getProperty('siteUrl');
/**
 * ☆folderIdの取得
 */
// =============================
// updatePageの定義
// 指定したフォルダごとにページ（HTML）を生成・更新する関数
// =============================
const folderIdGeneral     = properties.getProperty('folderIdGeneral');
const folderIdEngineering     = properties.getProperty('folderIdEngineering');
const folderIdLiterature  = properties.getProperty('folderIdLiterature');
const folderIdOthers      = properties.getProperty('folderIdOthers');
const homePath = '';

const githubOption = { "name": name, "email": email };
let github = new GitHubAPI.GitHubAPI(githubUserName, githubRepository, githubAccessToken, githubOption);
let branch = github.getBranch(branchName);
let pTree = github.getTree(branch['commit']['commit']['tree']['sha']);

/**
 * 内部ユーティリティ: 現在保持している pTree を元にコミットを作成しブランチを更新後、
 * branch / pTree を最新状態へリフレッシュする。
 * 複数の update* 関数を 1 実行内で連続呼出した際に、親コミットが古いままになることで
 * 先行コミットが履歴上孤立する(後続コミットが同じ親を指す)問題を防ぐ。
 * @param {string} message コミットメッセージ
 */
function performCommitAndRefresh(message){
  const data = { tree: pTree['tree'] };
  const tree = github.createTree(data);
  const commit = github.createCommit(message, tree['sha'], branch['commit']['sha']);
  github.updateReference(branchName, commit['sha']);
  // リフレッシュ: 後続処理が常に最新の親を参照するようにする
  branch = github.getBranch(branchName);
  pTree = github.getTree(branch['commit']['commit']['tree']['sha']);
  return commit;
}
/**
 * 自動生成，日付と更新した科目を入力
 * @type {string}
 */
let commitMessageList = [];
let commitMessage = "";
/**
 * 手動入力，自動更新でない場合に入力して実行することでコミットメッセージに追加される。基本は空文字列
 * @type {string}
 */
let commitMessage2 = "";

/**
 * 教科書一覧ページ生成
 * スクリプトプロパティに spreadsheetIdTextbooks, sheetNameTextbooks を設定しておくこと
 * 出力: textbooks_1.html, textbooks_2.html, ... （30件/ページ）
 */
function updateTextbookPages(){
  // プロパティ名: 仕様に合わせ最優先で 'spreadsheetId'、無ければ後方互換で 'spreadsheetIdTextbooks'
  const spreadsheetId = properties.getProperty('spreadsheetId') || properties.getProperty('spreadsheetIdTextbooks');
  const sheetName = properties.getProperty('sheetNameTextbooks') || 'Sheet1';
  if(!spreadsheetId){
    throw new Error('spreadsheetId (または spreadsheetIdTextbooks) が設定されていません');
  }
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if(!sheet){
    throw new Error('教科書シート '+sheetName+' が存在しません');
  }
  const values = sheet.getDataRange().getValues();
  if(values.length < 2){
    throw new Error('教科書データがありません');
  }
  // ヘッダー行解析
  const header = values[0];
  const colIndex = (name) => header.indexOf(name);
  const idxSubject = colIndex('科目名');
  const idxTeacher = colIndex('教員名'); // 任意列
  const idxYear    = colIndex('年度');
  const idxCat     = colIndex('区分');
  const idxBook    = colIndex('教科書');
  const idxLink    = colIndex('リンク');
  const idxNote    = colIndex('注記');
  const requiredIdx = {idxSubject, idxYear, idxCat, idxBook};
  Object.keys(requiredIdx).forEach(k=>{ if(requiredIdx[k] === -1) throw new Error('必須列が見つかりません: '+k.replace('idx','')); });

  // 行→オブジェクト
  const records = values.slice(1).filter(r => r[idxSubject] !== '').map(r => ({
    subject: String(r[idxSubject] || ''),
    teacher: idxTeacher !== -1 ? String(r[idxTeacher] || '') : '',
    year: String(r[idxYear] || ''),
    category: String(r[idxCat] || ''),
    textbook: String(r[idxBook] || ''),
    link: String(r[idxLink] || ''),
    note: String(r[idxNote] || ''),
  }));

  // 要件: 科目名昇順のみ
  records.sort((a,b)=> a.subject.localeCompare(b.subject,'ja'));

  const perPage = 30;
  const totalPages = Math.max(1, Math.ceil(records.length / perPage));
  const updatedFiles = [];

  for(let page=1; page<= totalPages; page++){
    const start = (page-1)*perPage;
    const part = records.slice(start, start+perPage);
    let htmlTemplate = HtmlService.createTemplateFromFile('pages_textbook');
    htmlTemplate.textbookList = part;
    htmlTemplate.content = part; // 後方互換
    htmlTemplate.pageNum = page;
    htmlTemplate.pageCount = totalPages;
    htmlTemplate.pageUrl = 'textbooks_'+page+'.html';
    htmlTemplate.title = '教科書一覧';
    htmlTemplate.parentUrl = "";
    htmlTemplate.parentTitle = '教科書一覧'; // parentTitleを追加
    const html = htmlTemplate.evaluate().getContent();
    const blob = github.createBlob(html);
    pTree['tree'] = pTree['tree'].concat([
      { path: 'textbooks_'+page+'.html', mode: '100644', type: 'blob', sha: blob['sha'] }
    ]);
    updatedFiles.push('textbooks_'+page+'.html');
  }

  commitMessage = Utilities.formatDate(new Date(), 'JST', 'yyyy-MM-dd') + ' 教科書一覧更新 ' + updatedFiles.join(',');
  performCommitAndRefresh(commitMessage);
}

// index.htmlを更新
function updateIndexPage(){
  commitMessage = Utilities.formatDate(new Date(), "JST", "yyyy-MM-dd") + 'トップ' + commitMessage2;
  let htmlTemplate = HtmlService.createTemplateFromFile('index');
  const html = htmlTemplate.evaluate().getContent();
  const blob = github.createBlob(html);
  const data = {
    'tree': pTree['tree'].concat([
      {
      'path': 'index.html',
      'mode': '100644',
      'type': 'blob',
      'sha': blob['sha']
      }
    ])
  };
  const tree = github.createTree(data);
  const commit = github.createCommit(commitMessage, tree['sha'], branch['commit']['sha']);
  const result = github.updateReference(branchName, commit['sha']);
  Logger.log(result);
  return;
}

// upload.htmlを更新
function updateUploadPage(){
  commitMessage = Utilities.formatDate(new Date(), "JST", "yyyy-MM-dd") + 'アップロード' + commitMessage2;
  let htmlTemplate = HtmlService.createTemplateFromFile('upload');
  const html = htmlTemplate.evaluate().getContent();
  const blob = github.createBlob(html);
  const data = {
    'tree': pTree['tree'].concat([
      {
      'path': 'upload.html',
      'mode': '100644',
      'type': 'blob',
      'sha': blob['sha']
      }
    ])
  };
  const tree = github.createTree(data);
  const commit = github.createCommit(commitMessage, tree['sha'], branch['commit']['sha']);
  const result = github.updateReference(branchName, commit['sha']);
  Logger.log(result);
  return;
}

/**
 * 全学教育科目のpageを更新
 */
function updatePagesGeneral(){
  const rootFolderId = folderIdGeneral;
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  makeDescendantPages(rootFolder, "index.html");
  
  if(commitMessageList.length > 0){
    commitMessage = Utilities.formatDate(new Date(), "JST", "yyyy-MM-dd") + '全学' + commitMessage2 + ',' + commitMessageList.join(',');
  const result = performCommitAndRefresh(commitMessage);
  Logger.log(result);
    commitMessageList = [];
  }
  return;
}

/**
 * 工学部専門科目のpageを更新
 */
function updatePagesEngineering(){
  const rootFolderId = folderIdEngineering;
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  makeDescendantPages(rootFolder, "index.html");

  if(commitMessageList.length > 0){
    commitMessage = Utilities.formatDate(new Date(), "JST", "yyyy-MM-dd") + '工学部専門' + commitMessage2 + ',' + commitMessageList.join(',');
  const result = performCommitAndRefresh(commitMessage);
  Logger.log(result);
    commitMessageList = [];
  }
  return;
}

/**
 * 文学部専門科目のpageを更新
 */
function updatePagesLiterature(){
  const rootFolderId = folderIdLiterature;
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  makeDescendantPages(rootFolder, "index.html");

  if(commitMessageList.length > 0){
    commitMessage = Utilities.formatDate(new Date(), "JST", "yyyy-MM-dd") + '文学部専門' + commitMessage2 + ',' + commitMessageList.join(',');
  const result = performCommitAndRefresh(commitMessage);
  Logger.log(result);
    commitMessageList = [];
  }
  return;
}

/**
 * その他の専門科目のpageを更新
 */
function updatePagesOthers(){
  const rootFolderId = folderIdOthers;
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  makeDescendantPages(rootFolder, "index.html");

  if (commitMessageList.length > 0){
    commitMessage = Utilities.formatDate(new Date(), "JST", "yyyy-MM-dd") + 'その他の専門' + commitMessage2 + ',' + commitMessageList.join(',');
    const result = performCommitAndRefresh(commitMessage);
    Logger.log(result);
    commitMessageList = [];
  }
  return;
}

/**
 * 統合更新関数（提案A）
 * 1 本の時間トリガーで全ての生成処理を順番に行いたい場合に使用します。
 * 既存の各 updateXXX 関数内で個別コミットされるため、コミットは複数並びます。
 * コミットを 1 回にまとめたい高度版は、各関数をリファクタし commit 抑制フラグを導入する必要あり（未実装）。
 */
function updateAllSitePages(){
  const started = new Date();
  Logger.log('[updateAllSitePages] start ' + started.toISOString());
  const tasks = [
    { name: 'textbook', fn: updateTextbookPages },
    { name: 'general', fn: updatePagesGeneral },
    { name: 'engineering', fn: updatePagesEngineering },
    { name: 'literature', fn: updatePagesLiterature },
    { name: 'others', fn: updatePagesOthers },
  ];
  tasks.forEach(t => {
    try {
      Logger.log('[updateAllSitePages] run ' + t.name);
      t.fn();
    } catch (e) {
      Logger.log('[updateAllSitePages][ERROR] ' + t.name + ': ' + e + '\n' + (e && e.stack ? e.stack : ''));
    }
  });
  Logger.log('[updateAllSitePages] end');
}

/**
 * folder以下のすべてのフォルダについて，再帰的にupdatePage()を実行
 * 
 * @param {Object} folder [DriveApp folder class]
 * @param {string} parentPage [folderの1つ上のフォルダに該当するページのurl ex:index.html]
 */
function makeDescendantPages(folder, parentPage){
  const page = updatePage(folder, parentPage);
  const childFolders = folder.getFolders();
  while(childFolders.hasNext()){
    const childFolder = childFolders.next();
    makeDescendantPages(childFolder, page);
  }
  return;
}

/**
 * folder以下のすべてのフォルダについて，再帰的にupdatePage()を実行
 * 
 * @param {Object} folder [DriveApp folder class]
 * @param {string} parentPage [folderの1つ上のフォルダに該当するページのurl ex:index.html]
 * @return {string} [folderに該当するページのurl ex:folder.html]
 */
 /**
 * updatePageの定義
 */
function updatePage(folder, parentPage){
  const folderName = folder.getName();
  const page = folderName.replace(/[\(\)]/g,"") + '.html';
  
  const myData = getFilesIdIn(folder);
  const now = new Date().getTime();
  const thresholdMs = pageUpdateThresholdHours * 60 * 60 * 1000;
  // 既に pTree に同名パスが存在するか（まだ一度も生成していない場合は必ず生成するため）
  const pageExists = pTree['tree'].some(item => item.path === homePath + page);
  const isRecent = (now - myData['updated']) < thresholdMs; // "最近更新された" 判定
  // 旧仕様: isRecent のときだけ生成 → 古いが未生成のフォルダや空フォルダが 404 になり得た
  // 新仕様: (未生成) または (最近更新) の場合は生成。既存ページで古く変更なしならスキップ。
  
  if(!pageExists || isRecent){
    const contents = makeContents(folder, myData);
    
    let htmlTemplate = HtmlService.createTemplateFromFile('pages');
    // ================= パンくずリスト簡略化 =================
    // 以前: Google Drive 上の物理的な親フォルダをすべて辿っていたため
    //   「トップ > マイドライブ > HU2025 > ...」のようにサイト外の階層が表示されてしまった。
    // 今回: サイト論理階層のみ表示したいので parentPage (index.html または 1つ上のカテゴリページ) のみを利用。
    //   index.html の場合は「トップ」がテンプレート内で既に表示されるため breadcrumb には現在フォルダのみ追加。
    let breadcrumb = [];
    if (parentPage && parentPage !== 'index.html') {
      breadcrumb.push({ title: parentPage.replace(/\.html$/, ''), url: parentPage });
    }
    breadcrumb.push({ title: folderName, url: page }); // 最後はテンプレ側で span 表示される
    htmlTemplate.breadcrumb = breadcrumb;

    htmlTemplate.pageUrl     = page;
    htmlTemplate.parentUrl   = parentPage;
    htmlTemplate.parentTitle = parentPage.substr(0,parentPage.length-5);
    htmlTemplate.content     = contents;
    htmlTemplate.title       = folderName;
    const html = htmlTemplate.evaluate().getContent();
    
    const blob = github.createBlob(html);
    pTree['tree'] = pTree['tree'].concat([
      {
      'path': homePath + page,
      'mode': '100644',
      'type': 'blob',
      'sha': blob['sha']
      }]);
    commitMessageList.push(folderName);
  }
  return page;
}

/**
 * フォルダ，ファイル一覧のhtmlを生成
 * 
 * @param {Object} rootFolder [DriveApp folder class 一覧を生成したいフォルダ]
 * @param {Object} myData [{folder: Array<{name: string,fileId: string}>, file: Array<{name: string,fileId: string}>, updated: number} rootFolder内のフォルダとファイルに関するデータ]
 * 
 * @return {string} [<li>タグによる各フォルダ，ファイルのリスト]
 */
function makeContents(rootFolder, myData){
  let contents = "";
  
  const rootFolderName = rootFolder.getName().replace(/[\(\)]/g,"");
  // NOTE: プレビュー / ブランチデプロイでも動くよう内部リンクは相対パス推奨。
  // Tweet 用だけ本番 siteUrl を使いたいので pageUrl は siteUrl(設定があれば) + ファイル名。
  const pageFileName = rootFolderName + '.html';
  const pageUrl = (siteUrl ? siteUrl.replace(/\/$/, '') + '/' : '') + pageFileName;  //現在表示しているページのurl（シェア用）
  
  //tweetbottunUrl1,2の間にファイル名を入れてtweetボタンのテキストに
  const tweetbottunUrl1 = "https://twitter.com/intent/tweet?hashtags=HU2025,"
                      + rootFolderName
                      + "&ref_src=twsrc%5Etfw&text=HU2025で";
  const tweetbottunUrl2 = "を解いたよ&url=" + encodeURIComponent(pageUrl) + "&tw_p=tweetbutton&ref_src=twsrc%5Etfw";
  //encodeURI(encodeURI())ではなくencodeURIComponent()がただしいのでは？　←修正済
  
  for(let i in myData["folder"]){
    
    let folderId = JSON.stringify(myData["folder"][i]["fileId"]);
    let folderName = JSON.stringify(myData["folder"][i]["name"]);
    folderId   = folderId.substr(1,folderId.length-2);     //.substr(1,folderId.length-2)で””を取り除く
    folderName = folderName.substr(1,folderName.length-2);
    //<li><a href="https://script.google.com/macros/s/[scriptId]/dev?id=[folderId]">[folderName]</a></li>
  // 内部リンクは相対パス: <a href="フォルダ名.html"> にすることで preview ドメインでも 404 になりにくい
  const folderNameNormalized = folderName.replace(/\(/g,"").replace(/\)/g,"");
  contents += "<li><a href=\"" + encodeURI(folderNameNormalized) + ".html\">" + folderName + "</a></li>";
  }
  // フォルダもファイルも無い場合は案内メッセージを 1 行追加
  if(myData["folder"].length === 0 && myData["file"].length === 0){
    contents += "<li>（募集中！）</li>";
  }
  for(let i=0; myData["file"][i] != undefined; i++){
    
    let fileId = JSON.stringify(myData["file"][i]["fileId"]);
    let fileName = JSON.stringify(myData["file"][i]["name"]);
    fileId = fileId.substr(1,fileId.length-2);
    fileName = fileName.substr(1,fileName.length-2);
    //<li><a href="https://drive.google.com/file/d/[fileId]" target="_blank">[fileName]</a>
    //<a href="[tweetbottunUrl]" class="tweetbottun">&nbsp;ツイート&nbsp;</a></li>
    contents += "<li><a href=\"https://drive.google.com/file/d/" + fileId + "\" target=\"_blank\">" + fileName + "</a> " //ファイルへのリンク
              + "<a href=\"" + tweetbottunUrl1 + fileName.replace(/\..*/g,"") + tweetbottunUrl2 + "\" class=\"twitter-hashtag-button\">Tweet</a></li>"; //tweetボタン
  }
  return contents;
}

/**
 * targetFolder内のfile,folderの情報を取得
 * 
 * @param {Object} targetFolder [DriveApp folder class 一覧を生成したいフォルダ]
 * 
 * @return {Object} myData [{folder: Array<{name: string,fileId: string}>, file: Array<{name: string,fileId: string}>, updated: number} targetFolder内のフォルダとファイルに関するデータ]
 */
function getFilesIdIn(targetFolder){
  let result = {folder: [], file: [], updated: targetFolder.getLastUpdated().getTime()};
  
  //targetFolder直下の全fileのnameとidを取得
  const files = targetFolder.getFiles();
  while(files.hasNext()){
    const file = files.next();
    result["file"].push({name: file.getName(),fileId: file.getId()});
    result["updated"] = (result["updated"] > file.getLastUpdated().getTime())? result["updated"] : file.getLastUpdated().getTime();
  }
  
  //targetFolder直下の全folderのnameとidを取得
  const childFolders = targetFolder.getFolders();
  while(childFolders.hasNext()){
    const childFolder = childFolders.next();
    result["folder"].push({name: childFolder.getName(), fileId: childFolder.getId()});
    result["updated"] = (result["updated"] > childFolder.getLastUpdated().getTime())? result["updated"] : childFolder.getLastUpdated().getTime();
  }
  
  result["file"].sort(function(a,b){ //filename昇順でソート
    if(a.name < b.name) return -1;
    else return 1;
  });
  result["folder"].sort(function(a,b){ //foldername昇順でソート
    if(a.name < b.name) return -1;
    else return 1;
  });
  return result;
}

/**
 * htmlにhtmlを入れるための関数
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
//css.htmlをindex.htmlやpages.htmlにincludeするための関数
//参考：https://tonari-it.com/gas-html-css/#toc4
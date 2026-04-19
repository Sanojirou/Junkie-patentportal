import { Store } from './store.js';
import { UI } from './ui.js';
import { LawParser } from './lawParser.js';

// --- アプリケーションの状態管理 ---
let articlePool = [];      // 読み込んだ全条文を保管する場所
let currentTab = 'home';   // 現在「ホーム」か「プロフィール」か
let quotingData = null;    // 引用しようとしているデータ
let replyingToData = null; // 返信しようとしているデータ

// --- 画面要素の取得 ---
const timeline = document.getElementById('timeline');
const postInput = document.getElementById('post-input');
const submitBtn = document.getElementById('submit-post');
const quotePreview = document.getElementById('quote-preview');
const quotePreviewContent = document.getElementById('quote-preview-content');
const cancelQuoteBtn = document.getElementById('cancel-quote');

/**
 * 1. 初期化処理
 * 起動時に一度だけ実行され、XMLファイルを読み込みます。
 */
async function init() {
  const loading = document.getElementById('loading');
  
  try {
    // law_data.xml を読みに行く
    const res = await fetch('./law_data.xml'); 
    
    if (!res.ok) {
      throw new Error(`ファイルが見てかりません (Status: ${res.status})`);
    }
    
    const xmlText = await res.text();
    const generator = LawParser.parseXmlGenerator(xmlText);

    // 解析された条文を一つずつ articlePool に追加していく
    for await (const article of generator) {
      articlePool.push(article);
    }

    // 読み込み中表示を消す
    if (loading) loading.style.display = 'none';

    // 最初に一度画面を描画する
    renderTimeline();

  } catch (error) {
    console.error("初期化エラー:", error);
    if (loading) loading.innerText = "データの読み込みに失敗しました。";
  }
}

/**
 * 2. タイムラインの描画処理
 * 現在のタブに合わせて表示する内容を作り、画面を更新します。
 */
function renderTimeline() {
  if (!timeline) return;

  // 自分の投稿データを取得
  const myPosts = Store.getActions();
  let displayData = [];

  if (currentTab === 'home') {
    // 【ホームタブの場合】
    // 自分の投稿と条文を混ぜる（Twitterのおすすめフィード風）
    // ここでは単純に「自分の投稿」の間に「条文」を挟み込むロジックにします
    
    let combined = [];
    // 自分の投稿をベースにする
    myPosts.forEach((post, index) => {
      combined.push(post);
      // 2件ごとに条文を1つ差し込む（articlePoolから順番に取り出す例）
      if ((index + 1) % 2 === 0 && articlePool[index / 2]) {
        combined.push(articlePool[index / 2]);
      }
    });

    // まだ投稿が少ない場合は、条文を多めに表示する
    if (combined.length < 10) {
      const additionalArticles = articlePool.slice(combined.length, 20);
      combined = [...combined, ...additionalArticles];
    }
    
    displayData = combined;
  } else {
    // 【プロフィールタブの場合】
    // 自分が投稿したもの（メモ、引用、返信）だけを表示する
    displayData = myPosts;
  }

  // UIモジュールにデータを渡して、画面を作ってもらう
  UI.renderTimeline(timeline, displayData, {
    onQuote: (data) => handlePrepareQuote(data),
    onReply: (data) => handlePrepareReply(data),
    onShowDetail: (data) => UI.showDetailModal(data)
  });
}

/**
 * 3. 投稿・アクション関連の関数
 */

// 引用の準備
function handlePrepareQuote(data) {
  quotingData = data;
  replyingToData = null;
  
  quotePreviewContent.innerText = data.text || data.articleText || "";
  quotePreview.style.display = 'block';
  postInput.placeholder = "引用してコメント...";
  postInput.focus();
}

// 返信の準備
function handlePrepareReply(data) {
  replyingToData = data;
  quotingData = null;
  
  const targetName = data.num ? `第${data.num}条` : "投稿";
  postInput.placeholder = `${targetName} への返信をポスト...`;
  postInput.focus();
}

// 投稿ボタンが押された時の処理
function handleSend() {
  const text = postInput.value.trim();
  if (!text) return;

  if (quotingData) {
    Store.saveQuote(text, quotingData);
  } else if (replyingToData) {
    Store.saveReply(text, replyingToData.id);
  } else {
    Store.savePost(text);
  }

  // 投稿が終わったら入力欄をリセット
  quotingData = null;
  replyingToData = null;
  postInput.value = '';
  postInput.style.height = 'auto';
  quotePreview.style.display = 'none';
  postInput.placeholder = "今日はどの条文を攻略する？";
  
  // 画面を最新の状態に更新
  renderTimeline();
}

/**
 * 4. イベントリスナー（ボタン操作などの登録）
 */

// 送信ボタン
submitBtn.addEventListener('click', handleSend);

// Ctrl + Enter で送信
postInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleSend();
  }
});

// 入力に合わせてテキストエリアの高さを変える
postInput.addEventListener('input', () => {
  postInput.style.height = 'auto';
  postInput.style.height = postInput.scrollHeight + 'px';
});

// 引用キャンセル
cancelQuoteBtn.addEventListener('click', () => {
  quotingData = null;
  quotePreview.style.display = 'none';
  postInput.placeholder = "今日はどの条文を攻略する？";
});

// タブ切り替え（ホーム / プロフィール）
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // 見た目の切り替え
    document.querySelector('.tab.active').classList.remove('active');
    tab.classList.add('active');

    // 状態の更新と再描画
    currentTab = tab.dataset.tab; // index.htmlの data-tab="home" などを取得
    renderTimeline();
  });
});

// アプリの開始
init();
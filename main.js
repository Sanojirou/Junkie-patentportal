import { Store } from './store.js';
import { UI } from './ui.js';
import { LawParser } from './lawParser.js';

// --- アプリケーションの状態管理 ---
let articlePool = [];      
let currentTab = 'home';   
let quotingData = null;
let replyingToData = null;

// --- 要素の取得 ---
const timeline = document.getElementById('timeline');
const postInput = document.getElementById('post-input');
const submitBtn = document.getElementById('submit-post');
const quotePreview = document.getElementById('quote-preview');
const quotePreviewContent = document.getElementById('quote-preview-content');
const cancelQuoteBtn = document.getElementById('cancel-quote');

/**
 * 1. 初期化処理
 */
async function init() {
  const loading = document.getElementById('loading');
  
  try {
    const res = await fetch('./law_data.xml'); 
    
    if (!res.ok) {
      throw new Error(`ファイルが見つかりません (Status: ${res.status})`);
    }
    
    const xmlText = await res.text();
    const generator = LawParser.parseXmlGenerator(xmlText);

    // 全条文をプールに格納
    for await (const article of generator) {
      articlePool.push(article);
    }

  } catch (error) {
    console.error("読み込みエラー:", error);
  } finally {
    // 成功・失敗に関わらず、読み込み中表示を消す
    if (loading) loading.style.display = 'none';
    renderTimeline(); // 最後にタイムラインを描画
  }
}

/**
 * 2. タイムラインの描画
 */
function renderTimeline() {
  if (!timeline) return;

  // 記憶係(Store)から自分の過去の投稿データを取得
  const myPosts = Store.getActions();
  let displayData = [];

  // 現在のタブが「ホーム」か「プロフィール」かで処理を分ける
  if (currentTab === 'home') {
    // 【ホームタブ】自分の投稿と、条文データを混ぜる
    myPosts.forEach((post, index) => {
      // 取り出したデータを「post」という名前で扱い、画面用リストに追加
      displayData.push(post);
      
      // 自分の投稿2件につき、条文を1つ差し込む
      const articleIndex = Math.floor(index / 2);
      if ((index + 1) % 2 === 0 && articlePool[articleIndex]) {
        displayData.push(articlePool[articleIndex]);
      }
    });

    // まだ自分の投稿が少なくて画面が寂しい場合は、条文を多めに追加して画面を埋める
    if (displayData.length < 10) {
      const extraArticles = articlePool.slice(displayData.length, 20);
      displayData = displayData.concat(extraArticles);
    }
  } else {
    // 【プロフィールタブ】条文は混ぜず、自分の投稿だけを表示する
    displayData = myPosts;
  }

  // 用意したデータを UI.js に渡して画面を作ってもらう
  UI.renderTimeline(timeline, displayData, {
    onQuote: (data) => {
      quotingData = data;
      replyingToData = null; 
      quotePreviewContent.innerText = `引用: ${data.num ? '第' + data.num + '条' : 'ポスト'}`;
      quotePreview.style.display = 'block';
      postInput.placeholder = "引用してコメント...";
      postInput.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onReply: (data) => {
      replyingToData = data;
      quotingData = null; 
      quotePreviewContent.innerText = `返信先: ${data.num ? '第' + data.num + '条' : 'ユーザー'}`;
      quotePreview.style.display = 'block';
      postInput.placeholder = "返信を書く...";
      postInput.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onShowDetail: (source) => UI.showDetailModal(source)
  });
}

// --- イベントリスナーの登録 ---

// 送信ボタンのロジック
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

  // 状態リセット
  quotingData = null;
  replyingToData = null;
  postInput.value = '';
  postInput.style.height = 'auto';
  quotePreview.style.display = 'none';
  postInput.placeholder = "今日はどの条文を攻略する？";
  renderTimeline();
}

submitBtn.addEventListener('click', handleSend);

// Ctrl + Enter 実装
postInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleSend();
  }
});

// テキストエリアの自動伸縮
postInput.addEventListener('input', () => {
  postInput.style.height = 'auto';
  postInput.style.height = postInput.scrollHeight + 'px';
});

// 引用キャンセルボタン
cancelQuoteBtn.addEventListener('click', () => {
  quotingData = null;
  quotePreview.style.display = 'none';
  postInput.placeholder = "今日はどの条文を攻略する？";
  postInput.style.height = 'auto';
});

// タブ切り替え
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentTab = e.target.dataset.tab;
    renderTimeline();
  });
});

// 最後に実行！
init();
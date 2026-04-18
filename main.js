import { Store } from './store.js';
import { UI } from './ui.js';
import { LawParser } from './lawParser.js';

// --- アプリケーションの状態管理 ---
let articlePool = [];      // 解析済みの全条文
let currentTab = 'home';   // 現在のタブ ('home' or 'profile')
let quotingData = null;    // 現在引用しようとしている条文データ

// --- main.js の冒頭付近 ---
const timeline = document.getElementById('timeline');
const postInput = document.getElementById('post-input');
const submitBtn = document.getElementById('submit-post');

// 新しく追加する要素
const quotePreview = document.getElementById('quote-preview');
const quotePreviewContent = document.getElementById('quote-preview-content');
const cancelQuoteBtn = document.getElementById('cancel-quote');

/**
 * 初期化処理
 */
async function init() {
  const loading = document.getElementById('loading');
  
  try {
    const res = await fetch('./law_data.xml'); 
    
    if (!res.ok) {
      throw new Error(`HTTPエラー! ステータス: ${res.status}。ファイルが見つからないか、パスが間違っています。`);
    }
    
    const xmlText = await res.text();
    
    // デバッグ用: 取得したテキストの冒頭を表示
    console.log("取得データ冒頭:", xmlText.substring(0, 100));

    const generator = LawParser.parseXmlGenerator(xmlText);

    for await (const article of generator) {
      articlePool.push(article);
      if (articlePool.length === 10) {
        loading.style.display = 'none';
        renderTimeline();
      }
    }
  } catch (e) {
    console.error("詳細エラー:", e);
    loading.innerText = "Error: " + e.message;
  }
}

/**
 * タイムラインの描画
 */
function renderTimeline() {
  if (articlePool.length === 0) return;
  
  timeline.innerHTML = '';
  const myActions = Store.getActions(); // localStorageから取得

  let displayItems = [];

  if (currentTab === 'home') {
    // 【おすすめモード】
    // 1. ユーザーの投稿（すべて）
    // 2. ランダムに選ばれた条文（5〜10件程度）
    const randomArticles = [...articlePool]
      .sort(() => 0.5 - Math.random())
      .slice(0, 8)
      .map(art => ({ ...art, type: 'law' }));

    // ユーザー投稿とランダム条文を混ぜる（ユーザー投稿を上にする）
    displayItems = [...myActions, ...randomArticles];
  } else {
    // 【プロフィールモード】
    // 自分の投稿のみ表示
    displayItems = myActions;
    if (displayItems.length === 0) {
      timeline.innerHTML = '<div id="loading">まだ投稿がありません。</div>';
      return;
    }
  }

  // 要素を作成して追加
  displayItems.forEach(item => {
    const postEl = UI.createPostElement(item, (data) => {
      // 引用ボタンが押された時の処理
      setQuote(data);
    });
    timeline.appendChild(postEl);
  });
}

/**
 * 引用状態のセット
 */
function setQuote(data) {
  quotingData = data;
  // 表示名の判定
  const targetName = data.num ? `特許法 ${data.num}` : '自分の投稿';
  postInput.placeholder = `${targetName} を引用中...`;
  postInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 投稿イベント
 */
submitBtn.addEventListener('click', () => {
  const text = postInput.value.trim();
  if (!text) return;

    if (quotingData) {
      Store.saveQuote(text, quotingData);
      quotingData = null;
      quotePreview.style.display = 'none'; // プレビューを隠す
    } else {
      Store.savePost(text);
    }

  postInput.value = '';
  postInput.style.height = 'auto'; // 高さをリセット
  postInput.placeholder = "今日はどの条文を攻略する？";
  renderTimeline();
});

/**
 * タブ切り替えイベント
 */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    
    currentTab = e.target.dataset.tab;
    renderTimeline();
  });
});

// 実行
init();

/**
 * テキストエリアの自動伸縮ロジック
 */
postInput.addEventListener('input', () => {
  // 一旦高さをリセットして計算し直すことで、文字を消した時も縮むようになります
  postInput.style.height = 'auto';
  postInput.style.height = postInput.scrollHeight + 'px';
});

/**
 * 引用解除（キャンセル）処理
 */
cancelQuoteBtn.addEventListener('click', () => {
  quotingData = null;
  quotePreview.style.display = 'none';
  postInput.placeholder = "今日はどの条文を攻略する？";
  
  // 高さを元に戻す
  postInput.style.height = 'auto';
});

/**
 * 引用状態のセット（アップデート版）
 */
function setQuote(data) {
  quotingData = data;
  const targetName = data.num ? `特許法 第${data.num}条` : 'ユーザーの投稿';
  const targetText = data.text || data.articleText || "";

  // プレビューエリアを表示し、中身を書き換える
  quotePreview.style.display = 'block';
  quotePreviewContent.innerHTML = `
    <div class="quoted-card" style="margin:0; padding:10px; font-size:0.85rem; border-color: var(--accent);">
      <strong style="color:var(--accent);">${targetName}</strong>
      <div style="color:var(--text-sub); overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
        ${targetText}
      </div>
    </div>
  `;
  
  postInput.placeholder = "コメントを追加...";
  postInput.focus();
  
  // 投稿直後に引用がセットされた場合、一番上までスクロールさせる
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
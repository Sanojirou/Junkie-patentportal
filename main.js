import { Store } from './store.js';
import { UI } from './ui.js';
import { LawParser } from './lawParser.js';

// --- アプリケーションの状態管理 ---
let articlePool = [];      
let currentTab = 'home';   
let quotingData = null;    

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
  try {
    // パスを law_data.xml に修正
    const res = await fetch('./law_data.xml'); 
    if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);
    
    const xmlText = await res.text();
    const generator = LawParser.parseXmlGenerator(xmlText);

    for await (const article of generator) {
      articlePool.push(article);
    }
    
    document.getElementById('loading').style.display = 'none';
    renderTimeline();
  } catch (e) {
    console.error("初期化失敗:", e);
  }
}

/**
 * 2. タイムラインの描画
 */
function renderTimeline() {
  timeline.innerHTML = '';
  const myActions = Store.getActions();

  let displayItems = [];
  if (currentTab === 'home') {
    const randomArticles = [...articlePool]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);
    displayItems = [...myActions, ...randomArticles];
  } else {
    displayItems = myActions;
  }

  displayItems.forEach(item => {
    const postEl = UI.createPostElement(item, (data) => setQuote(data));
    timeline.appendChild(postEl);
  });
}

/**
 * 3. 引用状態のセット
 */
function setQuote(data) {
  quotingData = data;
  const targetName = data.num ? `特許法 第${data.num}条` : 'ユーザーの投稿';
  const targetText = data.text || data.articleText || "";

  quotePreview.style.display = 'block';
  quotePreviewContent.innerHTML = `
    <div class="quoted-card" style="margin:0; padding:10px; font-size:0.85rem; border: 1px solid var(--accent);">
      <strong style="color:var(--accent);">${targetName}</strong>
      <div style="color:var(--text-sub); overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
        ${targetText}
      </div>
    </div>
  `;
  
  postInput.placeholder = "コメントを追加...";
  postInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- イベントリスナーの登録 ---

// 投稿ボタン
submitBtn.addEventListener('click', () => {
  const text = postInput.value.trim();
  if (!text) return;

  if (quotingData) {
    Store.saveQuote(text, quotingData);
    quotingData = null;
    quotePreview.style.display = 'none';
  } else {
    Store.savePost(text);
  }

  postInput.value = '';
  postInput.style.height = 'auto'; // 高さを戻す
  postInput.placeholder = "今日はどの条文を攻略する？";
  renderTimeline();
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
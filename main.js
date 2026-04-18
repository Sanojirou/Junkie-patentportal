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
    // 修正：ファイル名を正確に指定
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

    // 読み込み表示を消して描画
    if (loading) loading.style.display = 'none';
    renderTimeline();

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
  timeline.innerHTML = '';
  const actions = Store.getActions();

  actions.forEach(data => {
    // UI.createPostElement の第2引数をオブジェクトとして渡す
    const postEl = UI.createPostElement(data, {
      onQuote: (d) => {
        quotingData = d;
        showQuotePreview(d); // プレビュー表示関数を呼ぶ
      },
      onReply: (d) => {
        replyingToData = d;
        postInput.placeholder = `返信を書き込む...`;
        postInput.focus();
      },
      onShowDetail: (source) => {
        // 必要ならモーダルを表示する処理
      }
    });
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

// 送信ボタンのロジック
submitBtn.addEventListener('click', () => {
  const text = postInput.value.trim();
  if (!text) return;

  if (quotingData) {
    Store.saveQuote(text, quotingData);
    quotingData = null;
  } else if (replyingToData) {
    Store.saveReply(text, replyingToData.id); // リプライ保存
    replyingToData = null;
  } else {
    Store.savePost(text);
  }

// UIリセット
  postInput.value = '';
  quotePreview.style.display = 'none';
  postInput.placeholder = "今日はどの条文を攻略する？";
  renderTimeline();
});

// main.js に追加
postInput.addEventListener('keydown', (e) => {
  // Ctrl + Enter (Macの場合は Cmd + Enter も考慮)
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault(); // 改行を防ぐ
    submitBtn.click();  // すでにあるクリックイベントをそのまま発火させる
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
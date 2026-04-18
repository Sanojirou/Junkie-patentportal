import { Store } from './store.js';
import { UI } from './ui.js';
import { LawParser } from './lawParser.js';

// --- アプリケーションの状態管理 ---
let articlePool = [];      // 解析済みの全条文
let currentTab = 'home';   // 現在のタブ ('home' or 'profile')
let quotingData = null;    // 現在引用しようとしている条文データ

const timeline = document.getElementById('timeline');
const postInput = document.getElementById('post-input');
const submitBtn = document.getElementById('submit-post');

/**
 * 初期化処理
 */
async function init() {
  const loading = document.getElementById('loading');
  
  try {
    // 1. XMLデータの取得と解析
    const res = await fetch('./law_data.xml');
    if (!res.ok) throw new Error("XMLファイルの取得に失敗しました");
    
    const xmlText = await res.text();
    const generator = LawParser.parseXmlGenerator(xmlText);

    // ジェネレーターを回してプールに蓄積
    for await (const article of generator) {
      articlePool.push(article);
      
      // 最初の数件が溜まったら、一旦表示して「動いてる感」を出す
      if (articlePool.length === 10) {
        loading.style.display = 'none';
        renderTimeline();
      }
    }
    console.log("全条文の読み込み完了:", articlePool.length);
  } catch (e) {
    console.error(e);
    if (loading) loading.innerText = "エラーが発生しました: " + e.message;
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
  postInput.placeholder = `特許法 ${data.num} を引用中...`;
  postInput.focus();
  // スムーズに上部へスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 投稿イベント
 */
submitBtn.addEventListener('click', () => {
  const text = postInput.value.trim();
  if (!text) return;

  if (quotingData) {
    // 引用投稿
    Store.saveQuote(text, quotingData);
    quotingData = null;
    postInput.placeholder = "今日はどの条文を攻略する？";
  } else {
    // 通常投稿
    Store.savePost(text);
  }

  postInput.value = '';
  renderTimeline(); // 再描画
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
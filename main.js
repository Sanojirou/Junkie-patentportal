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
    // 1. ファイル名が law_data.xml.txt になっている場合はこちらに合わせる
    const res = await fetch('./law_data.xml.txt'); 
    
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
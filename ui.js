/**
 * UIコンポーネント生成モジュール
 */
/**
 * UIコンポーネント生成モジュール
 */
export const UI = {
  createPostElement(data, { onQuote, onReply, onShowDetail }) {
    const isQuote = data.type === 'quote';
    const isReply = data.type === 'reply';
    const isUser = data.type === 'user' || isQuote || isReply;
    
    const post = document.createElement('div');
    post.className = 'post';

    // アカウント名の判定（データが無い時のために || でデフォルト値を設定）
    const articleLabel = data.num ? `特許法 第${data.num}条` : "特許法";
    const displayName = isUser ? 'あなた' : articleLabel;
    const userId = isUser ? '@Learner' : '@Patent_Act_JP';

  let quoteHtml = '';
      if (isQuote && data.quotedFrom) {
        quoteHtml = `
          <div class="quoted-card" data-fulltext="${encodeURIComponent(data.quotedFrom.text)}">
            <div class="user-meta">
              <span class="user-name">特許法 ${data.quotedFrom.num || ''}</span>
            </div>
            <div class="article-text mini">${data.quotedFrom.text}</div>
            <div style="font-size: 0.8rem; color: var(--accent); margin-top: 4px;">クリックして全文を表示</div>
          </div>
        `;
    }

    const contentText = isQuote ? data.comment : (data.text || data.articleText || "");
    const displayName = isUser ? 'あなた' : `特許法 ${data.num}`;
    const userId = isUser ? '@Learner' : '@Patent_Act_JP';

// アクションボタン（返信・引用）の追加
    post.innerHTML = `
          <div class="post-body" style="display: flex; gap: 12px;">
            <div class="icon">${isUser ? '🎓' : '⚖️'}</div>
            <div class="post-content">
              <div class="user-meta">
                <span class="user-name">${displayName}</span>
                <span class="user-id">${userId}</span>
                <span class="timestamp">${data.timestamp || ''}</span>
              </div>
              <div class="article-text">${contentText.replace(/\n/g, '<br>')}</div>
              <div class="post-actions" style="margin-top: 12px; display: flex; gap: 20px;">
                <button class="action-btn reply-btn">💬 返信</button>
                <button class="action-btn quote-btn">🔄 引用</button>
              </div>
            </div>
          </div>
        `;

    // イベントリスナーの紐付け
    post.querySelector('.reply-btn').onclick = () => onReply(data);
    post.querySelector('.quote-btn').onclick = () => onQuote(data);
    const quoteCard = post.querySelector('.quoted-card');
    if (quoteCard) {
      quoteCard.onclick = () => onShowDetail(data.quotedFrom);
    }

    return post;
  },

  // 詳細ビュー（簡易モーダル）を表示するメソッド
  showDetailModal(source) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${source.num ? '特許法 第' + source.num : '詳細'}</h3>
        <div class="modal-body">${source.text.replace(/\n/g, '<br>')}</div>
        <button class="btn-primary close-modal">閉じる</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close-modal').onclick = () => modal.remove();
  }
};
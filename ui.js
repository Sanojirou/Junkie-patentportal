/**
 * UIコンポーネント生成モジュール
 */
export const UI = {
  // 第2引数をオブジェクトとして受け取る（デフォルト値を空オブジェクトに設定）
  createPostElement(data, { onQuote, onReply, onShowDetail } = {}) {
    const isQuote = data.type === 'quote';
    const isReply = data.type === 'reply';
    const isUser = data.type === 'user' || isQuote || isReply;
    
    const post = document.createElement('div');
    post.className = 'post';

    // 名前とIDの判定
    const articleNum = data.num || data.articleNum || '?';
    const displayName = isUser ? 'あなた' : `特許法 第${articleNum}条`;
    const userId = isUser ? '@Learner' : '@Patent_Act_JP';

    let quoteHtml = '';
    if (isQuote && data.quotedFrom) {
      quoteHtml = `
        <div class="quoted-card">
          <div class="user-meta">
            <span class="user-name">特許法 ${data.quotedFrom.num || ''}</span>
          </div>
          <div class="article-text mini">${data.quotedFrom.text}</div>
        </div>
      `;
    }

    const contentText = isQuote ? data.comment : (data.text || data.articleText || "");

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
          ${quoteHtml}
          <div class="post-actions" style="margin-top: 12px; display: flex; gap: 20px;">
            <button class="action-btn reply-btn">💬 返信</button>
            <button class="action-btn quote-btn">🔄 引用</button>
          </div>
        </div>
      </div>
    `;

    // 安全にイベントを割り当て
    const replyBtn = post.querySelector('.reply-btn');
    const quoteBtn = post.querySelector('.quote-btn');

    if (replyBtn) replyBtn.onclick = () => onReply && onReply(data);
    if (quoteBtn) quoteBtn.onclick = () => onQuote && onQuote(data);

    return post;
  },

  // 63行目の修正：const item にし、引数名を timelineElement に
  renderTimeline(timelineElement, dataList, handlers) {
    if (!timelineElement) return;
    timelineElement.innerHTML = ''; 

    for (const item of dataList) { // itemを宣言
      const postEl = this.createPostElement(item, handlers);
      timelineElement.appendChild(postEl);
    }
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
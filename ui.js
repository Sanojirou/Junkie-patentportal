/**
 * UIコンポーネント生成モジュール
 */
/**
 * UIコンポーネント生成モジュール
 */
export const UI = {
  createPostElement(data, onQuoteClick) {
    const isQuote = data.type === 'quote';
    const isUser = data.type === 'user' || isQuote;
    const post = document.createElement('div');
    post.className = 'post';

    let quoteHtml = '';
    if (isQuote && data.quotedFrom) {
      // 引用元の表示名（条文番号 or 'あなた'）を判定
      const quotedName = data.quotedFrom.num ? `特許法 ${data.quotedFrom.num}` : 'あなた';
      const quotedId = data.quotedFrom.num ? '@Patent_Act_JP' : '@Learner';

      quoteHtml = `
        <div class="quoted-card">
          <div class="user-meta">
            <span class="user-name">${quotedName}</span>
            <span class="user-id">${quotedId}</span>
          </div>
          <div class="article-text mini">${data.quotedFrom.text}</div>
        </div>
      `;
    }

    const contentText = isQuote ? data.comment : (data.text || data.articleText);
    const displayName = isUser ? 'あなた' : `特許法 ${data.num}`;
    const userId = isUser ? '@Learner' : '@Patent_Act_JP';

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
          <div class="actions">
            <button class="quote-btn">引用</button>
          </div>
        </div>
      </div>
    `;

    // 引用ボタンのイベント
    post.querySelector('.quote-btn').addEventListener('click', () => {
      onQuoteClick(data);
    });

    return post;
  }
};
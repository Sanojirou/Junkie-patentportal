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
    if (isQuote) {
      quoteHtml = `
        <div class="quoted-card">
          <div class="user-meta"><span class="user-name">特許法 ${data.quotedFrom.num}</span></div>
          <div class="article-text mini">${data.quotedFrom.text}</div>
        </div>
      `;
    }

    const contentText = isQuote ? data.comment : (data.text || data.articleText || data.text);
    const displayName = isUser ? 'あなた' : `特許法 ${data.num}`;

    post.innerHTML = `
      <div class="post-body" style="display: flex; gap: 12px;">
        <div class="icon">${isUser ? '🎓' : '⚖️'}</div>
        <div class="post-content">
          <div class="user-meta">
            <span class="user-name">${displayName}</span>
            <span class="user-id">${isUser ? '@Learner' : '@Patent_Act_JP'}</span>
          </div>
          <div class="article-text">${contentText.replace(/\n/g, '<br>')}</div>
          ${quoteHtml}
          <div class="actions">
            <span class="action-btn quote-trigger">🔁 引用</span>
          </div>
        </div>
      </div>
    `;

    post.querySelector('.quote-trigger').addEventListener('click', () => onQuoteClick(data));
    return post;
  }
};
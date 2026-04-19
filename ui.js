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
    const displayName = isUser ? 'あなた' : `特許法 ${articleNum}`;
    const userId = isUser ? '@Learner' : '@Patent_Act_JP';

    // 返信ポストの場合、迷子にならないようラベルをつける
        let replyHtml = '';
        if (isReply) {
          replyHtml = `<div style="font-size: 13px; color: var(--text-sub); margin-bottom: 8px; font-weight: bold;">💬 返信のポスト</div>`;
        }

        // 引用カードの作成
        let quoteHtml = '';
        if (isQuote && data.quotedFrom) {
          quoteHtml = `
            <div class="quoted-card" style="cursor: pointer; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; margin-top: 8px;">
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

    // --- ここからクリックイベントの交通整理 ---
        const replyBtn = post.querySelector('.reply-btn');
        const quoteBtn = post.querySelector('.quote-btn');
        const quotedCard = post.querySelector('.quoted-card');

        // 「返信」「引用」ボタンを押した時は、ポスト全体クリック（単体表示）の誤爆を防ぐ
        if (replyBtn) {
          replyBtn.onclick = (e) => {
            e.stopPropagation(); // クリックの貫通を防止
            if (handlers.onReply) handlers.onReply(data);
          };
        }
        if (quoteBtn) {
          quoteBtn.onclick = (e) => {
            e.stopPropagation();
            if (handlers.onQuote) handlers.onQuote(data);
          };
        }

        // 引用カード部分だけを狙ってクリックした時は、引用元の条文を単体表示
        if (quotedCard) {
          quotedCard.onclick = (e) => {
            e.stopPropagation();
            if (handlers.onShowDetail) handlers.onShowDetail(data.quotedFrom);
          };
        }

        // ポストのそれ以外の場所をクリックしたら、このポストを単体表示
        post.onclick = () => {
          if (handlers.onShowDetail) handlers.onShowDetail(data);
        };

        return post;
      },

  renderTimeline(timelineElement, dataList, handlers) {
    if (!timelineElement) return;
    timelineElement.innerHTML = ''; 

    for (const item of dataList) { // itemを宣言
      const postEl = this.createPostElement(item, handlers);
      timelineElement.appendChild(postEl);
    }
  },
  // 詳細ビュー（簡易モーダル）を表示するメソッド
// 単体表示用のモーダル（以前の引数名 source を維持しつつ、中身をTwitter風にアップグレード）
  showDetailModal(source) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    // 以前のプロパティ名（source.num, source.text）を活用しつつ判定
    const isUser = source.type === 'user' || source.type === 'quote' || source.type === 'reply';
    const articleNum = source.num || source.articleNum || '?';
    const displayName = isUser ? 'あなた' : `特許法 ${articleNum}`;
    const userId = isUser ? '@Learner' : '@Patent_Act_JP';
    
    // 表示する本文の決定（引用ならコメント、それ以外はtext）
    const contentText = source.type === 'quote' ? source.comment : (source.text || source.articleText || "");

    // モーダル内でも引用元を綺麗に表示する
    let modalQuoteHtml = '';
    if (source.type === 'quote' && source.quotedFrom) {
      modalQuoteHtml = `
        <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-top: 16px; background: rgba(255,255,255,0.05);">
          <div style="font-weight: bold; margin-bottom: 8px;">特許法 ${source.quotedFrom.num || ''}</div>
          <div style="color: var(--text-main); line-height: 1.5;">${source.quotedFrom.text}</div>
        </div>
      `;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    // スタイル設定
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(36, 45, 56, 0.8)';
    modal.style.backdropFilter = 'blur(4px)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    modal.innerHTML = `
      <div class="modal-content" style="background-color: #000; border: 1px solid var(--border-color); border-radius: 16px; width: 90%; max-width: 600px; max-height: 85vh; overflow-y: auto; display: flex; flex-direction: column;">
        
        <div style="padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; position: sticky; top: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);">
          <button id="close-modal" style="background: none; border: none; color: var(--text-main); font-size: 20px; cursor: pointer; margin-right: 20px;">←</button>
          <div style="font-weight: bold; font-size: 18px;">ポスト</div>
        </div>
        
        <div style="padding: 20px;">
          <div style="display: flex; gap: 12px; margin-bottom: 16px;">
            <div>
              <div style="font-weight: bold; font-size: 16px;">${displayName}</div>
              <div style="color: var(--text-sub); font-size: 14px;">${userId}</div>
            </div>
          </div>
          
          <div style="font-size: 18px; line-height: 1.6; word-break: break-all;">
            ${contentText.replace(/\n/g, '<br>')}
          </div>
          ${modalQuoteHtml}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 閉じる処理
    modal.querySelector('#close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }
};
/**
 * データ永続化モジュール
 */
const STORAGE_KEY = 'patent_sns_my_posts';

export const Store = {
  getActions() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  savePost(text) {
    const actions = this.getActions();
    const newPost = {
      id: 'post_' + Date.now(),
      type: 'user',
      text: text,
      timestamp: new Date().toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };
    actions.unshift(newPost);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    return newPost;
  },

  saveQuote(comment, originalData) {
    const actions = this.getActions();
    // 引用対象がすでに「引用」だった場合、その中の元データを引き継ぐ（またはフラットにする）
    const source = originalData.type === 'quote' ? originalData.quotedFrom : originalData;

    const newQuote = {
      id: 'quote_' + Date.now(),
      type: 'quote',
      comment: comment,
      quotedFrom: {
        num: source.num || source.articleNum,
        text: source.text || source.articleText
        },
    };
    actions.unshift(newQuote);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    return newQuote;
  },

    // store.js に追加・修正案
    saveReply(text, parentId) {
      const actions = this.getActions();
      const newReply = {
        id: 'reply_' + Date.now(),
        type: 'reply',
        parentId: parentId, // 親投稿のIDを紐付け
        text: text,
        timestamp: new Date().toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      };
      actions.unshift(newReply);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
      return newReply;
    }
};
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
    const newQuote = {
      id: 'quote_' + Date.now(),
      type: 'quote',
      comment: comment,
      quotedFrom: {
        num: originalData.num || originalData.articleNum,
        text: originalData.text || originalData.articleText
      },
      timestamp: new Date().toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };
    actions.unshift(newQuote);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    return newQuote;
  }
};
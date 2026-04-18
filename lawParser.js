/**
 * 漢数字変換・条文解析専門モジュール
 */
export const LawParser = {
  decodeLawNumbers(str) {
    const kanjiMap = { '〇': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
    const unitMap = { '十': 10, '百': 100, '千': 1000 };
    const convert = (kanji) => {
      let res = 0, tmp = 0;
      for (let char of kanji) {
        if (unitMap[char]) {
          tmp = (tmp === 0 ? 1 : tmp) * unitMap[char];
          res += tmp;
          tmp = 0;
        } else {
          tmp = kanjiMap[char];
        }
      }
      return (res + tmp).toString();
    };
    str = str.replace(/(条|項|号|の)([〇一二三四五六七八九十百千]+)/g, (m, prefix, kanji) => prefix + convert(kanji));
    str = str.replace(/(第|([0-9]+))([〇一二三四五六七八九十百千]+)(条|項|号|年|月|日|分之|回)/g, (m, p1, p2, kanji, suffix) => (p1 || p2) + convert(kanji) + suffix);
    return str;
  },

  async *parseXmlGenerator(xmlText) { // generatorにする
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const articles = xmlDoc.getElementsByTagName("Article");

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    const title = art.getElementsByTagName("ArticleTitle")[0]?.textContent || "";
    const paragraphs = art.getElementsByTagName("Paragraph");
    let textLines = [];
    
    for (let p of paragraphs) {
      const pNum = p.getElementsByTagName("ParagraphNum")[0]?.textContent || "";
      const sentences = p.getElementsByTagName("Sentence");
      let pText = "";
      for (let s of sentences) { pText += s.textContent; }
      const prefix = (pNum && pNum !== "1") ? `${pNum} ` : "";
      if (pText.trim()) textLines.push(prefix + this.decodeLawNumbers(pText.trim()));
    }

    const cleanText = textLines.join("\n");
    if (cleanText && !cleanText.match(/^(削除|〔削除〕)$/)) {
      yield { num: title, text: cleanText }; // 1条ずつ返す
    }
    
    // 50条ごとに一瞬休みを入れてUIスレッドを解放
    if (i % 50 === 0) await new Promise(r => setTimeout(r, 0));
  }
}
};


const verseText = '그러므로 회개하라 그리하지 아니하면 내가 네게 속히 임하여 내 입의 검으로 그들과 싸우리라';
const coreKeywords = ['내 입의', '검'];
function getExtraKeywords(verseText, coreKeywords, count, isLevel5 = false) {
    let words = verseText.replace(/[.,!?]/g, '').split(' ');
    if (isLevel5) return words.filter(w => w.length > 0 && !coreKeywords.some(ck => w.includes(ck) || ck.includes(w)));
    return [];
}
let targetKeywords = [...coreKeywords];
let allWords = verseText.replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
targetKeywords = targetKeywords.concat(getExtraKeywords(verseText, coreKeywords, allWords.length, true));
targetKeywords.sort((a, b) => b.length - a.length);

let htmlText = verseText;
targetKeywords.forEach((kw, i) => {
    let cleanKw = kw.replace(/[.,!?]/g, '').trim();
    // CHANGED here: use [\s.,!?]+ instead of [^<>]*?
    let searchWord = cleanKw.split(' ').join('[\\s.,!?]+');
    let regex = new RegExp(`(?<!<[^>]*)${searchWord}(?![^<]*>)`, 'i');
    let oldHtmlText = htmlText;
    htmlText = htmlText.replace(regex, `<span class="blank">[${kw}]</span>`);
});
console.log(htmlText);

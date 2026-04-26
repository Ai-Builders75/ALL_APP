const fs = require('fs');

const content = fs.readFileSync('database.js', 'utf8');
const data = JSON.parse(content.replace('const gameData = ', '').replace(/;\s*$/, ''));

let overlapIssues = 0;

for (const key of Object.keys(data)) {
    const stage = data[key];
    let htmlText = stage.verseText;
    
    let targetKeywords = [...stage.keywords];
    targetKeywords.sort((a,b) => b.length - a.length);
    
    let missing = [];
    
    targetKeywords.forEach(kw => {
        let cleanKw = kw.replace(/[.,!?]/g, '').trim();
        let searchWord = cleanKw.split(' ').join('[^<>]*?');
        let regex = new RegExp(`(?<!<[^>]*)${searchWord}(?![^<]*>)`, 'i');
        
        if (regex.test(htmlText)) {
            htmlText = htmlText.replace(regex, `[BLANK]`);
        } else {
            missing.push(kw);
        }
    });
    
    if (missing.length > 0) {
        console.log(`Overlap issue in Stage ${stage.stage} [${stage.verseRef}]:`);
        console.log(`  Keywords :`, stage.keywords);
        console.log(`  Missing  :`, missing);
        console.log(`  Verse    : "${stage.verseText}"`);
        overlapIssues++;
    }
}

console.log(`\nTotal overlap issues found: ${overlapIssues}`);

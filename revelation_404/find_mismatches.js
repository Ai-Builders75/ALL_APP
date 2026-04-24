const fs = require('fs');

const content = fs.readFileSync('database.js', 'utf8');
const data = JSON.parse(content.replace('const gameData = ', '').replace(/;\s*$/, ''));

let missingCount = 0;
for (const key of Object.keys(data)) {
    const stage = data[key];
    const text = stage.verseText;
    
    stage.keywords.forEach(kw => {
        // Strip punctuation but keep spaces for exact word boundary or substring match?
        // Actually, just do what index.html does:
        let cleanKw = kw.replace(/[.,!?]/g, '').trim();
        let searchWord = cleanKw.split(' ').join('[^<>]*?');
        let regex = new RegExp(`(?<!<[^>]*)${searchWord}(?![^<]*>)`, 'i');
        
        if (!regex.test(text)) {
            console.log(`Mismatch in Stage ${stage.stage} [${stage.verseRef}]:`);
            console.log(`  Keyword : "${kw}"`);
            console.log(`  Verse   : "${text}"`);
            missingCount++;
        }
    });
}

console.log(`\nTotal mismatches found: ${missingCount}`);

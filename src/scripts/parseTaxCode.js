const fs = require('fs');
const path = require('path');

const inputFile = 'C:\\Users\\hp\\Downloads\\30.12.2019.doc';
const outputFile = path.join(__dirname, '..', 'data', 'tax_code.json');

// Ensure data directory exists
const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Reading file...');
let html = '';
try {
    html = fs.readFileSync(inputFile, 'utf-8');
} catch (e) {
    console.error('Failed to read file:', e);
    process.exit(1);
}

console.log('File size:', html.length, 'bytes');

// Basic regex based structural parsing
// We want to capture: Qism, Bo'lim, Bob, Modda, and textual content accurately.
// Looking at the HTML structure:
// <div class="TEXT_HEADER_DEFAULT"><a id="-4675123">UMUMIY QISM</a></div>
// <div class="TEXT_HEADER_DEFAULT"><a id="-4675128">I BOʻLIM.<br />UMUMIY QOIDALAR</a></div>
// <div class="TEXT_HEADER_DEFAULT"><a id="-4675131">1-bob. Asosiy qoidalar</a></div>
// <div class="CLAUSE_DEFAULT"><a id="-4675133">1-modda. Oʻzbekiston Respublikasining ...</a></div>
// <div class="ACT_TEXT"><a id="-4675134">Ushbu Kodeks soliqlar va ...</a></div>

const extractText = (tagString) => {
    // Remove all HTML tags and decode basic entities if needed
    return tagString
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const items = [];
const regex = /<div class="(.*?)".*?>(.*?)<\/div>/g;

let match;
let currentQism = null;
let currentBolim = null;
let currentBob = null;
let currentModda = null;

let parsedCount = 0;

while ((match = regex.exec(html)) !== null) {
    const className = match[1];
    const innerHtml = match[2];
    const text = extractText(innerHtml);

    if (!text) continue;

    if (className.includes('TEXT_HEADER_DEFAULT')) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('qism')) {
            currentQism = text;
        } else if (lowerText.includes('boʻlim') || lowerText.includes('bo\'lim') || lowerText.includes('bolim')) {
            currentBolim = text;
        } else if (lowerText.includes('bob')) {
            currentBob = text;
        }
    } else if (className.includes('CLAUSE_DEFAULT')) {
        currentModda = {
            id: parsedCount++,
            qism: currentQism,
            bolim: currentBolim,
            bob: currentBob,
            title: text,
            content: [] // Array of text paragraphs
        };
        items.push(currentModda);
    } else if (className.includes('ACT_TEXT') || className.includes('BY_DEFAULT') || className.includes('TEXT_BOLD')) {
        if (currentModda) {
            currentModda.content.push(text);
        }
    }
}

console.log(`Parsed ${items.length} articles (Moddalar).`);
console.log('Writing to JSON...');

fs.writeFileSync(outputFile, JSON.stringify(items, null, 2), 'utf-8');

console.log('Successfully saved structured Tax Code entirely to:', outputFile);

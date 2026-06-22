import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Path configuration
const inputFile = './SSC CGL Tier 1 sentence improvement 250mcq.csv';
const outputFile = './SSC CGL Tier 1 sentence improvement 250mcq_translated.csv';

// Google Translate single request function
async function translateText(text) {
    if (!text || text.trim() === '') return '';
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        if (json && json[0]) {
            return json[0].map(x => x[0]).filter(Boolean).join('');
        }
        return '';
    } catch (e) {
        console.error(`Error translating: "${text.substring(0, 30)}...":`, e.message);
        return '';
    }
}

// Utility to sleep between requests to avoid rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('Reading input CSV file...');
    const csvData = fs.readFileSync(inputFile, 'utf8');
    
    console.log('Parsing CSV content...');
    const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true
    });
    
    const rows = parsed.data;
    console.log(`Found ${rows.length} rows to translate.`);
    
    const translatedRows = [];
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        console.log(`[${i + 1}/${rows.length}] Translating: "${row.text ? row.text.substring(0, 40) : 'Row ' + i}..."`);
        
        // Translate text and explanation
        const textHindi = await translateText(row.text);
        await sleep(150); // delay to avoid rate limits
        
        const explanationHindi = await translateText(row.explanation);
        await sleep(150);
        
        // Options in Hindi for English Grammar are usually kept identical/empty. 
        // We will default to empty strings as they are not needed to be translated.
        const optionAHindi = '';
        const optionBHindi = '';
        const optionCHindi = '';
        const optionDHindi = '';
        
        // Construct the new row matching the system headers
        const newRow = {
            exam: row.exam || 'SSC CGL Tier 1',
            subject: row.subject || 'English Comprehension',
            chapter: row.chapter || 'Sentence improvement',
            unit: row.unit || 'Sentence improvement',
            topic: row.topic || 'Sentence Improvement',
            difficulty: row.difficulty || 'Medium',
            type: row.type || 'MCQ',
            marks: row.marks || '2',
            negativeMarks: row.negativeMarks || row.negativeM || '0.5',
            text: row.text,
            textHindi: textHindi,
            optionA: row.optionA,
            optionAHindi: optionAHindi,
            optionB: row.optionB,
            optionBHindi: optionBHindi,
            optionC: row.optionC,
            optionCHindi: optionCHindi,
            optionD: row.optionD,
            optionDHindi: optionDHindi,
            correctOption: row.correctOption || row.correctOp || '',
            explanation: row.explanation,
            explanationHindi: explanationHindi
        };
        
        translatedRows.push(newRow);
    }
    
    console.log('Creating translated CSV...');
    const csvContent = Papa.unparse(translatedRows, {
        quotes: true // wrap in double quotes to prevent comma issues
    });
    
    fs.writeFileSync(outputFile, csvContent, 'utf8');
    console.log(`Success! Translated CSV written to: ${outputFile}`);
    console.log('You can now upload this translated file in the admin dashboard.');
}

main().catch(err => {
    console.error('Fatal error in translation script:', err);
});

const fs = require('fs');
const path = require('path');

const target1 = path.join(__dirname, 'questions_template.csv');
const target2 = path.join(__dirname, 'public', 'templates', 'questions_template.csv');

// Remove BOM if already exists, then write with BOM
const addBOM = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.startsWith('\ufeff')) {
        content = content.slice(1);
    }
    fs.writeFileSync(filePath, '\ufeff' + content, 'utf8');
    console.log('Successfully wrote BOM to:', filePath);
};

addBOM(target1);
addBOM(target2);

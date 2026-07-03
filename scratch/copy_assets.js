const fs = require('fs');
const path = require('path');

const srcClipboard = 'C:\\Users\\UPL\\.gemini\\antigravity-ide\\brain\\1a0b99db-2fdb-4afc-997b-6f6826dbdd44\\omr_clipboard_3d_1783079220193.png';
const srcStudent = 'C:\\Users\\UPL\\.gemini\\antigravity-ide\\brain\\1a0b99db-2fdb-4afc-997b-6f6826dbdd44\\student_character_3d_1783079242171.png';

const destDir = 'c:\\Users\\UPL\\react\\examinant\\src\\assets';

try {
    fs.copyFileSync(srcClipboard, path.join(destDir, 'omr_clipboard_3d.png'));
    console.log('Successfully copied clipboard asset!');
    fs.copyFileSync(srcStudent, path.join(destDir, 'student_character_3d.png'));
    console.log('Successfully copied student asset!');
} catch (err) {
    console.error('Error copying assets:', err);
}

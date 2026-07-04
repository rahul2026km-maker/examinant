const fs = require('fs');
const path = require('path');

const srcMascot = "C:/Users/UPL/.gemini/antigravity-ide/brain/1a0b99db-2fdb-4afc-997b-6f6826dbdd44/student_character_3d_1783079242171.png";
const destMascot = path.join(__dirname, 'public', 'student_mascot.png');

const srcClipboard = "C:/Users/UPL/.gemini/antigravity-ide/brain/1a0b99db-2fdb-4afc-997b-6f6826dbdd44/omr_clipboard_3d_1783079220193.png";
const destClipboard = path.join(__dirname, 'public', 'omr_clipboard.png');

try {
    fs.copyFileSync(srcMascot, destMascot);
    console.log("Successfully copied Mascot to public/student_mascot.png");
} catch (e) {
    console.error("Error copying Mascot:", e.message);
}

try {
    fs.copyFileSync(srcClipboard, destClipboard);
    console.log("Successfully copied Clipboard to public/omr_clipboard.png");
} catch (e) {
    console.error("Error copying Clipboard:", e.message);
}

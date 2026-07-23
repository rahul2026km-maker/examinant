const fs = require('fs');
const path = require('path');

const assets = [
    {
        src: "C:/Users/UPL/.gemini/antigravity-ide/brain/1a0b99db-2fdb-4afc-997b-6f6826dbdd44/student_mascot_green_bg_1783080372553.png",
        dest: path.join(__dirname, 'public', 'student_mascot.png')
    },
    {
        src: "C:/Users/UPL/.gemini/antigravity-ide/brain/1a0b99db-2fdb-4afc-997b-6f6826dbdd44/omr_clipboard_black_bg_1783079896186.png",
        dest: path.join(__dirname, 'public', 'omr_clipboard.png')
    },
    {
        src: "C:/Users/UPL/.gemini/antigravity-ide/brain/e7a33833-15ec-4eb4-aee9-caa786482b2c/laptop_mobile_crystal_clear_1784550494430.png",
        dest: path.join(__dirname, 'public', 'laptop_mobile_3d.png')
    }
];

for (const { src, dest } of assets) {
    try {
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`Successfully copied ${path.basename(dest)} to public/`);
        } else if (fs.existsSync(dest)) {
            console.log(`Asset ${path.basename(dest)} already present in public/`);
        } else {
            console.warn(`Source asset not found: ${src}`);
        }
    } catch (e) {
        console.error(`Error handling asset ${path.basename(dest)}:`, e.message);
    }
}


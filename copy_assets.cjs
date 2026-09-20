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
    },
    {
        src: "C:/Users/UPL/.gemini/antigravity-ide/brain/96e7cd1d-3d72-47f8-afe9-193c6593eb46/physics_faculty_raj_1789886485011.jpg",
        dest: path.join(__dirname, 'public', 'live_teacher_raj.jpg')
    },
    {
        src: "C:/Users/UPL/.gemini/antigravity-ide/brain/96e7cd1d-3d72-47f8-afe9-193c6593eb46/physics_lab_circuit_1789890085656.jpg",
        dest: path.join(__dirname, 'public', 'physics_lab_circuit.jpg')
    },
    {
        src: "C:/Users/UPL/.gemini/antigravity-ide/brain/96e7cd1d-3d72-47f8-afe9-193c6593eb46/anatomical_heart_3d_1789890104769.jpg",
        dest: path.join(__dirname, 'public', 'anatomical_heart_3d.jpg')
    },
    {
        src: "C:/Users/UPL/.gemini/antigravity-ide/brain/96e7cd1d-3d72-47f8-afe9-193c6593eb46/chemistry_molecule_3d_1789890123079.jpg",
        dest: path.join(__dirname, 'public', 'chemistry_molecule_3d.jpg')
    },
    {
        src: "C:/Users/UPL/.gemini/antigravity-ide/brain/96e7cd1d-3d72-47f8-afe9-193c6593eb46/support_agent_3d_1789892808469.jpg",
        dest: path.join(__dirname, 'public', 'support_agent_3d.jpg')
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


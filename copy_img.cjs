const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\UPL\\.gemini\\antigravity-ide\\brain\\e7a33833-15ec-4eb4-aee9-caa786482b2c\\laptop_mobile_3d_1784549660867.png";
const dest = path.join(__dirname, 'public', 'laptop_mobile_3d.png');

fs.copyFileSync(src, dest);
console.log("Successfully copied 3D image!");

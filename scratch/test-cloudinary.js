const fs = require('fs');
const http = require('https');

async function testCloudinary() {
    const cloudName = 'njd6pw71';
    const uploadPreset = 'gkggov';

    // Create a dummy image buffer 1x1 png
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const postData = `file=${encodeURIComponent(base64Image)}&upload_preset=${encodeURIComponent(uploadPreset)}`;

    const options = {
        hostname: 'api.cloudinary.com',
        port: 443,
        path: `/v1_1/${cloudName}/image/upload`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log(`Testing Cloudinary POST to https://api.cloudinary.com/v1_1/${cloudName}/image/upload with preset '${uploadPreset}'...`);

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response:', data);
        });
    });

    req.on('error', (e) => {
        console.error('Request error:', e);
    });

    req.write(postData);
    req.end();
}

testCloudinary();


const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testClipDrop() {
    try {
        const apiKey = process.env.CLIPDROP_API_KEY;
        if (!apiKey) {
            throw new Error('CLIPDROP_API_KEY is not set.');
        }

        const imagePath = '/home/ubuntu/projetoquaseperfeito/test-image.jpg';
        // Read the real image file for testing
        const imageBuffer = fs.readFileSync(imagePath);

        const form = new FormData();
        form.append('image_file', imageBuffer, { filename: 'test-image.jpg', contentType: 'image/jpeg' });

        const response = await axios.post('https://clipdrop-api.co/remove-background/v1', form, {
            headers: {
                'x-api-key': apiKey,
                ...form.getHeaders(),
            },
            responseType: 'arraybuffer',
        });

        if (response.status !== 200) {
            const errorText = Buffer.from(response.data).toString('utf-8');
            throw new Error(`ClipDrop API Error: ${response.status} - ${errorText}`);
        }

        fs.writeFileSync('/home/ubuntu/projetoquaseperfeito/test-removed.png', response.data);
        console.log('Background removal successful!');
    } catch (error) {
        console.error('Error removing background:', error.message);
    }
}

testClipDrop();


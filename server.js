const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('Missing URL');
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'Origin': 'https://proxy-relay.onrender.com',
                'Referer': targetUrl,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/vnd.apple.mpegurl')) {
            const data = await response.text();
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
            const rewrittenData = data.replace(/(^(?!#).*\.m3u8$)/gm, (match) => {
                const absoluteUrl = baseUrl + match;
                return `/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            }).replace(/(^(?!#).*\.ts$)/gm, (match) => {
                const absoluteUrl = baseUrl + match;
                return `/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            });

            res.setHeader('Content-Type', contentType);
            res.send(rewrittenData);
        } else {
            const buffer = await response.arrayBuffer();
            res.setHeader('Content-Type', contentType || 'application/octet-stream');
            res.send(Buffer.from(buffer));
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Proxy error');
    }
});

app.listen(PORT, () => {
    console.log(`Proxy Relay running on port ${PORT}`);
});

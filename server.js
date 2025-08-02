const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('Missing URL');
    }

    try {
        const response = await fetch(targetUrl);
        let contentType = response.headers.get('content-type');
        const data = await response.text();

        // If it's a M3U8 playlist, rewrite the URLs to go through proxy again
        if (contentType && contentType.includes('application/vnd.apple.mpegurl')) {
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
            // Relay all other content (like .ts chunks)
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

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy route
app.use('/proxy', createProxyMiddleware({
    target: '', // We'll set dynamic target using router option
    changeOrigin: true,
    ws: true,
    secure: false,
    selfHandleResponse: false,
    onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying to:', req.query.url);
        proxyReq.setHeader('User-Agent', 'VLC/3.0.11');
        proxyReq.setHeader('Referer', req.query.url);
        proxyReq.setHeader('Origin', 'http://localhost');
    },
    router: (req) => {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            throw new Error('Missing URL parameter');
        }
        const urlObj = new URL(targetUrl);
        return `${urlObj.protocol}//${urlObj.host}`;
    },
    pathRewrite: (path, req) => {
        const targetUrl = new URL(req.query.url);
        return targetUrl.pathname + targetUrl.search;
    }
}));

app.get('/', (req, res) => {
    res.send('Proxy Relay is running');
});

app.listen(PORT, () => {
    console.log(`Proxy relay server is running on port ${PORT}`);
});

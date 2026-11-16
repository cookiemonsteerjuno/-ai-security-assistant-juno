/**
 * server.js - SentinelAI Local Server Diagnostic Script
 * This script starts a lightweight HTTP server on port 3000
 * to verify local browser connectivity.
 */

const http = require('http');

const HOSTNAME = '127.0.0.1';
const PORT = 3000;

const server = http.createServer((req, res) => {
    console.log(`[Server] Connection received for path: ${req.url}`);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>SentinelAI Connection Test</title>
                <style>
                    body { background: #090d16; color: #38bdf8; font-family: monospace; text-align: center; padding-top: 50px; }
                    h1 { color: #f43f5e; }
                </style>
            </head>
            <body>
                <h1>SentinelAI Server Connected Successfully!</h1>
                <p>Your local environment is actively responding on port 3000.</p>
            </body>
        </html>
    `);
});

// Catch port binding errors (e.g., if port 3000 is already in use)
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[Error] Port ${PORT} is already in use by another application. Please close other running servers.`);
    } else {
        console.error('[Error] Server encountered an unexpected error:', err);
    }
});

server.listen(PORT, HOSTNAME, () => {
    console.log(`[Server] Active and listening at http://${HOSTNAME}:${PORT}/`);
});

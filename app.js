/**
 * app.js - Node.js Environment Verification Script
 * This script creates a simple HTTP server to test that Node.js
 * is correctly installed and executing JavaScript code.
 */

const http = require('http');

// Configuration constants
const HOSTNAME = '127.0.0.1';
const PORT = 3000;

// Create the HTTP server
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Node.js environment successfully configured and running!\n');
});

// Bind the server to the hostname and port
server.listen(PORT, HOSTNAME, () => {
    console.log(`[Server] Test server running at http://${HOSTNAME}:${PORT}/`);
});

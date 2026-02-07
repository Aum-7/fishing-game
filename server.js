const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Specific route for serving JS files with the correct MIME type for ES6 modules
app.get('/js/*.js', (req, res) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.sendFile(path.join(__dirname, req.path));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fishing game server listening at http://localhost:${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`Network access: http://${require('os').networkInterfaces()['eth0']?.[0]?.address || 'IP_ADDRESS'}:${PORT}`);
});
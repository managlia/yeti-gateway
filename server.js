const http = require('http');
const finalhandler = require('finalhandler');
const fs = require('fs');

const gatewayRouter = require('./gatweay/routes/gateway-routes'); //for local using "npm start"

const server = http.createServer(function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Cache-Control, Accept, X-TEST-EXTRA");
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    plainRouter(req, res, finalhandler(req, res))
});

const port = 5002;
server.listen(port, () => console.log(`Listening on port ${port}`));

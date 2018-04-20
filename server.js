const http = require('http');
const httpProxy = require('http-proxy');
const HttpProxyRules = require('http-proxy-rules');
const finalhandler = require('finalhandler');
const fs = require('fs');

const gatewayRouter = require('./gateway/routes/gateway-routes');

const proxyRules = new HttpProxyRules({
    rules: {
        '.*/yeti_': 'http://localhost:8082/yeti',
        '.*/yetix': 'http://localhost:5001/yetix'
    }
});

const proxy = httpProxy.createProxy();

const server = http.createServer(function (req, res) {
    const target = proxyRules.match(req);
    if (target) {
        return proxy.web(req, res, {
            target: target
        });
    } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Cache-Control, Accept, X-TEST-EXTRA");
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        gatewayRouter(req, res, finalhandler(req, res));
    }
});

const port = 5002;
server.listen(port, () => console.log(`Listening on port ${port}`));

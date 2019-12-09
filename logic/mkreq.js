const http = require('http');
const https = require('https');
const state = require('./state');

module.exports = (requestBody, contentType, targetPath, responseCallback) => {
    let hostname = state.MODE == 'idp' ? decodeURIComponent(JSON.parse(requestBody)['destination-url']) : decodeURIComponent(state.TARGET_URL)
    console.log(`Sending HTTP${state.send_https() ? 'S' : ''} Request to ${hostname}:${state.TARGET_PORT}${targetPath} with body: ${requestBody}`);
    let options = {
        hostname: hostname,
        port: state.TARGET_PORT,
        path: targetPath,
        method: 'POST',
        headers: {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(requestBody)
        },
    };
    if (state.MODE == 'broker') {
        options.cert = state.CERT;
        options.key = state.KEY;
        options.ca = state.CA;
        options.checkServerIdentity = function(host, cert) {
            return undefined;
        };
    }

    let http_module = state.send_https() ? https : http;
    let responseHandler = () => {};
    if (responseCallback) {
        responseHandler = (res) => {
            res.on('data', responseCallback);
            console.log('statusCode', res.statusCode);
            console.log('headers', res.headers);
        }
    }

    let req = http_module.request(options, responseHandler);
    req.on('error', (e) => {
        console.error(e);
      });
    req.write(requestBody);
    req.end();
}

const http = require('http');
const parseUrl = require('parseurl');
const Orchestrator = require('orchestrator');
const rp = require("request-promise");

const orchestrator = new Orchestrator();

const getAllFiles = (req, res) => {
    const url = 'http://localhost:5001/yetix/files';
    const options = {
        method: 'GET',
        uri: url,
        encoding: null,
        headers: {
            'content-type': 'application/json'
        },
        resolveWithFullResponse: true
    };
    rp(options).then( result => {
        console.log( 'result ===> ' + result.body );
        res.end(result.body);
        return res;
    }, error => {
        console.log('ERROR::: ' + JSON.stringify(error));
    });
};







module.exports = {
    getAllFiles
};







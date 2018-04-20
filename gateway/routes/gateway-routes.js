var http = require('http');
var Orchestrator = require('orchestrator');

var orchestrator = new Orchestrator();


app.post('/abc',function(req,res) {
    http.get(url,function(resp){
        resp.on('data',function(buf){//process buf here which is nothing but small chunk of response data});
            resp.on('end',function(){//when receiving of data completes});
            });
        });
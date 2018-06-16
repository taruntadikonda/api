var http = require('http');
var https=require('https');
var url = require('url');
var fs=require('fs');
var config=require('./config');
var data=require('./data');
var helpers=require('./helpers');
var handlers=require('./handlers');
var StringDecoder = require('string_decoder').StringDecoder;
var path=require('path');
var util = require('util');
var debug = util.debuglog('server');
var server={};

server.httpserver = http.createServer(function(req,res){
  server.common(req,res);
});

server.httpsserveroptions={
    'key':fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert':fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
}

server.httpsserver=https.createServer(server.httpsserveroptions,function(req,res)
{
    server.common(req,res);
});




server.common=function(req,res)
{
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');
    var queryStringObject = parsedUrl.query;
    var method = req.method;
    var headers = req.headers;

    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function() {
        buffer += decoder.end();


        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        var data = {
          'trimmedPath' : trimmedPath,
          'queryStringObject' : queryStringObject,
          'method' : method,
          'headers' : headers,
          'payload' : helpers.parsejson(buffer)
        };

        chosenHandler(data,function(statusCode,payload,contenttype){
          statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

          var payloadString = '';
          if(contenttype=='json'){
              res.setHeader('Content-Type','application/json');
              payload = typeof(payload) == 'object'? payload : {};
              payloadString=JSON.stringify(payload);
          }
          if(contenttype=='html'){
            res.setHeader('Content-Type','text/html');
            payloadString=typeof(payload)=='string'?payload:'';
          }
          if(contenttype=='favicon'){
            res.setHeader('Content-Type','image/x-icon');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }
          if(contenttype=='plain'){
            res.setHeader('Content-Type','text/plain');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }
          if(contenttype == 'css'){
            res.setHeader('Content-Type', 'text/css');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }

          if(contenttype == 'png'){
            res.setHeader('Content-Type', 'image/png');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }

          if(contenttype == 'jpg'){
            res.setHeader('Content-Type', 'image/jpeg');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }


          res.writeHead(statusCode);
          res.end(payloadString);
          debug("Returning this response: ",statusCode,payloadString);

        });

    });
}



server.router = {
  '':handlers.index,
  'account/create':handlers.accountcreate,
  'account/edit':handlers.accountedit,
  'account/delete':handlers.delete,
  'session/create':handlers.sessioncreate,
  'session/delete':handlers.seesiondelete,
  'checks/all':handlers.checkslist,
  'checks/create':handlers.checkscreate,
  'checks/edit':handlers.checksedit,
  'tarun' : handlers.tarun,
  'bhavana':handlers.bhavana,
  'ping':handlers.ping,
  'api/users':handlers.users,
  'api/tokens':handlers.tokens,
  'api/checks':handlers.checks,
  'favicon.ico' : handlers.favicon,
  'public' : handlers.public
};

server.init=function(){

  server.httpserver.listen(config.httpport,function(){
    console.log('\x1b[36m%s\x1b[0m','The HTTP server is running on port '+config.httpport);
  });

  server.httpsserver.listen(config.httpsport,function(){
      console.log('\x1b[36m%s\x1b[0m','The HTTPS server is running on port '+config.httpsport);
  });


}

module.exports=server;

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
        console.log(typeof(server.router[trimmedPath]));
        var data = {
          'trimmedPath' : trimmedPath,
          'queryStringObject' : queryStringObject,
          'method' : method,
          'headers' : headers,
          'payload' : helpers.parsejson(buffer)
        };

        chosenHandler(data,function(statusCode,payload){
          statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
          payload = typeof(payload) == 'object'? payload : {};
          var payloadString = JSON.stringify(payload);
          res.setHeader('Content-Type','application/json');
          res.writeHead(statusCode);
          res.end(payloadString);
          console.log("Returning this response: ",statusCode,payloadString);

        });

    });
}



server.router = {
  'tarun' : handlers.tarun,
  'bhavana':handlers.bhavana,
  'ping':handlers.ping,
  'users':handlers.users,
  'tokens':handlers.tokens,
  'checks':handlers.checks
};

server.init=function(){

  server.httpserver.listen(config.httpport,function(){
    console.log('The server '+config.httpport+" "+config.env);
  });

  server.httpsserver.listen(config.httpsport,function(){
      console.log('The server '+config.httpsport+" "+config.env);
  });


}

module.exports=server;

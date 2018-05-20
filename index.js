var http = require('http');
var https=require('https');
var url = require('url');
var fs=require('fs');
var config=require('./lib/config');
var data=require('./lib/data');
var helpers=require('./lib/helpers');
var handlers=require('./lib/handlers');
var StringDecoder = require('string_decoder').StringDecoder;

var httpserver = http.createServer(function(req,res){
  common(req,res);
});

var httpsserveroptions={
    'key':fs.readFileSync('./https/key.pem'),
    'cert':fs.readFileSync('./https/cert.pem')
}

var httpsserver=https.createServer(httpsserveroptions,function(req,res)
{
    common(req,res);
});



httpserver.listen(config.httpport,function(){
  console.log('The server '+config.httpport+" "+config.env);
});

httpsserver.listen(config.httpsport,function(){
    console.log('The server '+config.httpsport+" "+config.env);
});

var common=function(req,res)
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


        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        console.log(typeof(router[trimmedPath]));
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



var router = {
  'tarun' : handlers.tarun,
  'bhavana':handlers.bhavana,
  'ping':handlers.ping,
  'users':handlers.users,
  'tokens':handlers.tokens,
  'checks':handlers.checks
};

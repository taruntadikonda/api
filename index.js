var server=require('./lib/server');
var workers=require('./lib/workers');

var lib=require('./lib/data');


var app={};


app.init=function(){

server.init();


workers.init();

}

app.init();

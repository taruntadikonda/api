var crypto=require('crypto');
var config=require('./config');
var https=require('https');
var querystring=require('querystring');

var helpers={};


helpers.hash=function(password){
  if(typeof(password)=='string' && password.length >0){
      var hash=crypto.createHmac('sha256',config.hasingsecert).update(password).digest('hex');
      return hash;
  }else {
    return false;
  }
}

helpers.parsejson=function(buffer){
  try {
    var obj=JSON.parse(buffer);
    return obj;
  } catch (e) {
    return {};
  }
}

helpers.createtoken=function(number){

  var strlength=typeof(number)=='number' && number>0?number:false;
  if(strlength){

  var possiblestring='abcdefghijklmnopqrstuvwxyz'
  var str='';
  for(i=0;i<strlength;i++)
  {
    var randomstring=possiblestring.charAt(Math.floor(Math.random() * possiblestring.length));
    str+=randomstring;
  }
  return str;
}else {
  return false;
}
}

helpers.sendsms = function(phone,msg,callback){
  // Validate parameters
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
  if(phone && msg){

    // Configure the request payload
    var payload = {
      'From' : config.twilio.phone,
      'To' : '+91'+phone,
      'Body' : msg
    };
    var stringPayload = querystring.stringify(payload);


    // Configure the request details
    var requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : '/2010-04-01/Accounts/'+config.twilio.account+'/Messages.json',
      'auth' : config.twilio.account+':'+config.twilio.auth,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    var req = https.request(requestDetails,function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;
        // Callback successfully if the request went through
        if(status == 200 || status == 201){
          callback(false);
        } else {
          callback('Status code returned was '+status);
        }
    });


    req.on('error',function(e){
      callback(e);
    });
        req.write(stringPayload);

    // End the request
    req.end();

  } else {
    callback('Given parameters were missing or invalid');
  }
};

module.exports=helpers;

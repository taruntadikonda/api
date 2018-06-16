var crypto=require('crypto');
var config=require('./config');
var https=require('https');
var querystring=require('querystring');
var fs=require('fs');
var path=require('path');

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

helpers.gettemplate=function(templatename,data,cb){
    templatename=typeof(templatename)=='string' && templatename.length>0 ? templatename:false;
    if(templatename){
      var templatesdir=path.join(__dirname+'./../templates/');
      fs.readFile(templatesdir+templatename+'.html','utf8',function(err,str){
        if(!err && str && str.length>0){
          var finalstring=helpers.interpolate(str,data);
          cb(false,finalstring);
        }else {
          cb('template not exist');
        }
      });
    }else {
      cb('not a valid template name');
    }
}

helpers.addUniversalTemplates=function(str,data,cb){
  str=typeof(str)=='string' && str.length > 0 ? str :'';
  data=typeof(data)=='object' && data !== null ? data : {};
  helpers.gettemplate('header',data,function(err,headerstring){
    if(!err && headerstring){
      helpers.gettemplate('footer',data,function(err,footerstring){
        if(!err && footerstring){
          var fullstring=headerstring+str+footerstring;
          cb(false,fullstring);
        }else {
          cb('cannot find the footer page');
        }
      });
    }else {
      cb('cannot find the header page');
    }
  });
}

helpers.interpolate = function(str,data){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};

  // Add the templateGlobals to the data object, prepending their key name with "global."
  for(var keyName in config.templateGlobals){
     if(config.templateGlobals.hasOwnProperty(keyName)){
       data['global.'+keyName] = config.templateGlobals[keyName]
     }
  }
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for(var key in data){
     if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
        var replace = data[key];
        var find = '{'+key+'}';
        str = str.replace(find,replace);
     }
  }
  return str;
};

helpers.getstaticasset = function(fileName,callback){
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if(fileName){
    var publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+fileName, function(err,data){
      if(!err && data){
        callback(false,data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('A valid file name was not specified');
  }
};


module.exports=helpers;

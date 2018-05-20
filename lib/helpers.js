var crypto=require('crypto');
var config=require('./config');

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
module.exports=helpers;

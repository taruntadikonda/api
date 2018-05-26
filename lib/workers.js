var fs=require('fs');
var http=require('http');
var https=require('https');
var url=require('url');
var path=require('path');
var logs=require('./logs');
var _data=require('./data');
var helpers=require('./helpers');


var workers={};

workers.gatherallchecks=function(){

  _data.list('checks',function(err,listdata){

    if(!err && listdata && listdata.length>0){
      listdata.forEach(function(list){
        _data.read('checks',list,function(err,checkdata){
          if(!err && checkdata){
            workers.validatecheckdata(checkdata);
          }else {
            console.log('there is error in reading checks');
          }
        })
      })
    }else {
      console.log('no checks');
    }
  });
}



workers.loop=function(){
  setInterval(function(){
    workers.gatherallchecks();
  },1000*60);
}

workers.logloop=function(){
  setInterval(function(){
    workers.logcompress();
  },1000*60*60*24);

}

workers.logcompress=function(){
  logs.list(false,function(err,logsdata){
    if(!err && logsdata){
      logsdata.forEach(function(log){
        var logid=log.replace('.log','');
        var newlog=logid+'-'+Date.now();
        logs.compress(logid,newlog,function(err){
          if(!err){
            logs.truncate(logid,function(err){
              if(!err){
                console.log('truncation done');
              }else {
                console.log('error in truncating',err);
              }
            });
          }else {
            console.log('error in compressing');
          }
        });
      });
    }else {
      console.log('no log files to compress');
    }
  });
}


workers.init=function(){

  workers.gatherallchecks();
  workers.loop();
  workers.logloop();
  workers.logcompress();
}

workers.validatecheckdata=function(checkdata){
  checkdata=typeof(checkdata)=='object'&& checkdata!= null ? checkdata:{};
  checkdata.checkid=typeof(checkdata.checkid)=='string' && checkdata.checkid.trim().length==20?checkdata.checkid:false;
  checkdata.phone=typeof(checkdata.phone)=='string' && checkdata.phone.trim().length==10?checkdata.phone:false;
  checkdata.protocol=typeof(checkdata.protocol)=="string" && ['https','http'].indexOf(checkdata.protocol) > -1 ?checkdata.protocol:false;
  checkdata.url=typeof(checkdata.url)=="string" && checkdata.url.length > 0?checkdata.url:false;
  checkdata.method=typeof(checkdata.method)=="string" && ['GET','PUT','POST','DELETE'].indexOf(checkdata.method) > -1?checkdata.method:false;
  checkdata.successcodes = typeof(checkdata.successcodes) == 'object' && checkdata.successcodes instanceof Array && checkdata.successcodes.length > 0 ? checkdata.successcodes  : false;
  checkdata.timeoutseconds = typeof(checkdata.timeoutseconds) == 'number' && checkdata.timeoutseconds % 1 === 0 && checkdata.timeoutseconds >= 1 && checkdata.timeoutseconds <= 5 ? checkdata.timeoutseconds : false;

  checkdata.state = typeof(checkdata.state) == 'string' && ['up','down'].indexOf(checkdata.state) > -1 ? checkdata.state : 'down';
  checkdata.lastcheck = typeof(checkdata.lastcheck) == 'number' && checkdata.lastcheck > 0 ? checkdata.lastcheck : false;

if(checkdata.checkid && checkdata.phone && checkdata.protocol && checkdata.url && checkdata.method && checkdata.successcodes && checkdata.timeoutseconds){
  workers.performchecks(checkdata);
}else {
  console.log('error in validating the input parametrs');
}

}

workers.performchecks=function(checkdata){

  var checkoutcome={
    'error':false,
    'responsecode':false

  };
  var outcomesent=false;
  var parsedurl=url.parse(checkdata.protocol+'://'+checkdata.url,true);
  var hostname=parsedurl.hostname;
  var path=parsedurl.path;

  var requestdetails={
    'protocol':checkdata.protocol+':',
    'hostname':hostname,
    'method':checkdata.method,
    'path':path,
    'timeoutseconds':checkdata.timeoutseconds*1000
  };
  var moduletouse=checkdata.protocol=='http'?http:https;
  var req=moduletouse.request(requestdetails,function(res){
    var status=res.statusCode;
    checkoutcome.responsecode=status;
    if(!outcomesent){
      workers.processcheckoutcomes(checkdata,checkoutcome);
      outcomesent=true;
    }
  });

  req.on('error',function(e){
    checkoutcome.error={
      'error':true,
      'value':e
    };
    if(!outcomesent){
      workers.processcheckoutcomes(checkdata,checkoutcome);
      outcomesent=true;
    }
  });

  req.on('timeoutseconds',function(e){
    checkoutcome.error={
      'error':true,
      'value':'timeoutseconds'
    };
    if(!outcomesent){
      workers.processcheckoutcomes(checkdata,checkoutcome);
      outcomesent=true;
    }
  });
  req.end();
}

workers.processcheckoutcomes=function(checkdata,checkoutcome){

  var state= !checkoutcome.error && checkoutcome.responsecode && checkdata.successcodes.indexOf(checkoutcome.responsecode) > -1 ? 'up':'down';
  var alert=checkdata.lastchecked && checkdata.state !== state ? true : false;
  var timecheck=Date.now();
  workers.log(checkdata,checkoutcome,state,alert,timecheck);
  var newcheckdata=checkdata;
  newcheckdata.state=state;
  newcheckdata.lastchecked=timecheck;
  _data.update('checks',newcheckdata.checkid,newcheckdata,function(err){
    if(!err){
       if(alert){
         workers.alertuserstatus(newcheckdata);
       }else {
         console.log('no changes');
       }
    }else {
      console.log(err);
    }
  });
}

workers.alertuserstatus=function(newcheckdata){
  var msg=newcheckdata.method+'to'+newcheckdata.protocol+'://'+newcheckdata.url+'is'+newcheckdata.state;
  helpers.sendsms(newcheckdata.phone,msg,function(err){
    if(!err){
      console.log('allert is sent to the user');
    }
    else {
      console.log(err);
    }
  })
}


workers.log=function(checkdata,checkoutcome,state,alert,timecheck){
  var logdata={
    'checkdata':checkdata,
    'checkoutcome':checkoutcome,
    'state':state,
    'alert':alert,
    'timecheck':timecheck
  };

  var logstring=JSON.stringify(logdata);
  var logfile=checkdata.checkid;

  logs.append(logfile,logstring,function(err){
    if(!err){
      console.log('logging into the file done');
    }else {
      console.log('logging into the file is failed');
    }
  })
}
module.exports=workers;

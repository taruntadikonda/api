var fs=require('fs');
var path=require('path');
var zlib=require('zlib');




var logs={};

logs.basedir=path.join(__dirname+'/../.logs/');

logs.append=function(logfile,logstring,cb){
  fs.open(logs.basedir+logfile+'.log','a',function(err,filedis){
    if(!err && filedis){
      fs.appendFile(filedis,logstring+'\n',function(err){
        if(!err){
          fs.close(filedis,function(err){
            if(!err){
              cb(false);
            }else {
              cb('error in closing the file');
            }
          })
        }else {
          cb('error in appending the file');
        }
      })
    }else {
      cb('error in opening the file');
    }
  })
}



module.exports=logs;

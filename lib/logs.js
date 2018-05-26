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
  });
}


logs.list = function(includeCompressedLogs,cb){
  fs.readdir(logs.basedir, function(err,data){
    if(!err && data && data.length > 0){
      var trimmedFileNames = [];
      data.forEach(function(fileName){

        // Add the .log files
        if(fileName.indexOf('.log') > -1){
          trimmedFileNames.push(fileName.replace('.log',''));
        }

        // Add the .gz files
        if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs){
          trimmedFileNames.push(fileName.replace('.gz.b64',''));
        }

      });
      cb(false,trimmedFileNames);
    } else {
      cb(err,data);
    }
  });
}


logs.compress = function(logId,newFileId,cb){
  var sourceFile = logId+'.log';
  var destFile = newFileId+'.gz.b64';

  // Read the source file
  fs.readFile(logs.basedir+sourceFile, 'utf8', function(err,inputString){
    if(!err && inputString){
      // Compress the data using gzip
      zlib.gzip(inputString,function(err,buffer){
        if(!err && buffer){
          // Send the data to the destination file
          fs.open(logs.basedir+destFile, 'wx', function(err, fileDescriptor){
            if(!err && fileDescriptor){
              // Write to the destination file
              fs.writeFile(fileDescriptor, buffer.toString('base64'),function(err){
                if(!err){
                  // Close the destination file
                  fs.close(fileDescriptor,function(err){
                    if(!err){
                      cb(false);
                    } else {
                      cb(err);
                    }
                  });
                } else {
                  cb(err);
                }
              });
            } else {
              cb(err);
            }
          });
        } else {
          cb(err);
        }
      });

    } else {
      cb(err);
    }
  });
}

logs.decompress = function(fileId,cb){
  var fileName = fileId+'.gz.b64';
  fs.readFile(logs.basedir+fileName, 'utf8', function(err,str){
    if(!err && str){
      // Inflate the data
      var inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer,function(err,outputBuffer){
        if(!err && outputBuffer){
          
          var str = outputBuffer.toString();
          cb(false,str);
        } else {
          cb(err);
        }
      });
    } else {
      cb(err);
    }
  });
};

// Truncate a log file
logs.truncate = function(logId,cb){
  fs.truncate(logs.basedir+logId+'.log', 0, function(err){
    if(!err){
      cb(false);
    } else {
      cb(err);
    }
  });
}

module.exports=logs;

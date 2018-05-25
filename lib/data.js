var fs=require('fs');
var path=require('path');
var helpers=require('./helpers');

var lib={};


lib.basedir=path.join(__dirname,'/../.data/');

lib.create=function(dir,file,data,cb){

    fs.open(lib.basedir+dir+'/'+file+'.json','wx',function(err,filedis){
        if(!err && filedis){
            var stringdata=JSON.stringify(data);
            fs.writeFile(filedis,stringdata,function(err){
                if(!err){
                    fs.close(filedis,function(err){
                        if(!err){
                            cb(false)
                        }else{
                            cb('file nor closed');
                        }
                    })
                }
                else{
                    cb('error writing into file');
                }
            });
        }
        else{
            cb('cannot open file');
        }
    });
}

lib.read=function(dir,file,cb)
{
    fs.readFile(lib.basedir+dir+'/'+file+'.json','utf8',function(err,data)
    {
      if(!err && data){
        var parseddata=helpers.parsejson(data)
        cb(false,parseddata);
      }else {
        cb(err,data);
      }

    });
}

lib.update=function(dir,file,data,cb)
{
    fs.open(lib.basedir+dir+'/'+file+'.json','r+',function(err,filedis){
        if(!err && filedis){
            var stringdata=JSON.stringify(data);
            fs.truncate(filedis,function(err){
                if(!err){
                    fs.writeFile(filedis,stringdata,function(err){
                        if(!err){
                            fs.close(filedis,function(err){
                                if(!err){
                                    cb(false);
                                }else{
                                    cb('error in closing file');
                                }
                            });

                        }else{
                            cb('error in writing into file');
                        }
                    });

                }else{
                    cb('truncting error');
                }
            });

        }else{
            cb('cannot open file');
        }
    });
}

lib.delete=function(dir,file,cb)
{
    fs.unlink(lib.basedir+dir+'/'+file+'.json',function(err){
        if(!err){
            cb(false);
        }else{
            cb('error in delete');
        }
    })
}

lib.list=function(dir,cb){
  fs.readdir(lib.basedir+dir+'/',function(err,listdata){
    if(!err && listdata && listdata.length>0){
      var filelist=[];
      for(i=0;i<listdata.length;i++){
        filelist.push(listdata[i].replace('.json',''));
      }
      console.log(filelist);
      cb(false,filelist);
    }else {

      cb(400);
    }
  });
}

module.exports=lib;

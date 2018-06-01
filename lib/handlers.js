
var _data=require('./data')
var helpers=require('./helpers');
var config=require('./config');

var handlers = {};


handlers.users=function(data,cb)
{
    var methods=['POST','GET','PUT','DELETE'];
    if(methods.indexOf(data.method)> -1){
        handlers._users[data.method](data,cb);
    }else{
        cb(405);
    }
}

handlers._users={};


handlers._users.POST=function(data,cb){

  var firstname=typeof(data.payload.firstname)=='string' && data.payload.firstname.trim().length>0?data.payload.firstname.trim() : false;
  var lastname=typeof(data.payload.lastname)=='string' && data.payload.lastname.trim().length>0?data.payload.lastname.trim() : false;
  var phone=typeof(data.payload.phone)=='string' && data.payload.phone.trim().length==10?data.payload.phone.trim() : false;
  var password=typeof(data.payload.password)=='string' && data.payload.password.trim().length>0?data.payload.password.trim() : false;
  var aggrement=typeof(data.payload.aggrement)=='boolean' && data.payload.aggrement==true?true : false;

  if(firstname && lastname && phone && password && aggrement)
  {

    _data.read('users',phone,function(err,data){
      if(err)
      {
        var hashpassword=helpers.hash(password);

        if(hashpassword){
          var userobject={
            'firstname':firstname,
            'lastname':lastname,
            'phone':phone,
            'hashpassword':hashpassword,
            'aggrement':true
          }
          _data.create('users',phone,userobject,function(err){
            if(!err){
              cb(200);
            }else {
            console.log(err);
            cb(500,{'error':'errror in creating file'});
            }
          })
        }else {
            cb(500,{'error':'couldnot hash the password'});
        }


      }else{
        cb(400,{'error':'phone number is already taken'});
      }
    })

  }else {
    cb(400,{'error':'requirements missing'})
  }
}

handlers._users.GET=function(data,cb){

  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
if(phone){


  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

  handlers._tokens.verify(token,phone,function(tokenIsValid){
    if(tokenIsValid){

      _data.read('users',phone,function(err,data){
        if(!err && data){
          delete data.hashpassword;
          cb(200,data);
        } else {
          callback(404);
        }
      });
    } else {
      cb(403,{"Error" : "Missing required token in header, or token is invalid."})
    }
  });
} else {
  cb(400,{'Error' : 'Missing required field'})
}

}

handlers._users.PUT=function(data,cb){

  var firstname=typeof(data.payload.firstname)=='string' && data.payload.firstname.trim().length>0?data.payload.firstname.trim() : false;
  var lastname=typeof(data.payload.lastname)=='string' && data.payload.lastname.trim().length>0?data.payload.lastname.trim() : false;
  var phone=typeof(data.payload.phone)=='string' && data.payload.phone.trim().length==10?data.payload.phone.trim() : false;
  var password=typeof(data.payload.password)=='string' && data.payload.password.trim().length>0?data.payload.password.trim() : false;

  if(phone){
      if(firstname || lastname || password){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verify(token,phone,function(tokenIsValid){
          if(tokenIsValid){
            _data.read('users',phone,function(err,data){
              if(firstname){
                data.firstname=firstname;
              }
              if(lastname){
                data.lastname=lastname;
              }
              if(password){
                data.hashpassword=helpers.hash(password);
              }
              _data.update('users',phone,data,function(err){
                if(!err){
                  cb(200);
                }else {
                  console.log(err);
                  cb(500,{'error':'error in updating '});
                }
              })
            });
          }else {
            cb(400,{'error':'token not valid'});
          }
        });


      }else {
        cb(400,{'error':'field nor mentioned'});
      }
  }else {
    cb(400,{'error':'phone number not mentioned'});
  }
}

handlers._users.DELETE=function(data,cb){


  var phone=typeof(data.queryStringObject.phone=='string' && data.queryStringObject.phone.trim().length==10)?data.queryStringObject.phone.trim() : false;
  if(phone){
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verify(token,phone,function(tokenIsValid){
      if(tokenIsValid){
        _data.read('users',phone,function(err,userdata){
          if(!err && userdata){
            _data.delete('users',phone,function(err){
              if(!err){
                var userchecks=typeof(userdata.checks)=='object' && userdata.checks instanceof Array  ? userdata.checks : [];
                var checklen=userchecks.length;
                if(checklen>0){
                  for(i=0;i<checklen;i++){
                    _data.delete('checks',userchecks[i],function(err){
                      if(!err){
                        cb(200);
                      }else {
                        cb(400,{'error':'unable to delete'});
                      }
                    });
                  }
                }else {
                  cb(400,{'error':'no checks'});
                }
              }else {
                cb(500,{'error':'unable to delete'})
              }
            });
          }else {
            cb(400,{'error':'not found'})
          }
        });
      }else {
        cb(400,{'error':'token not valid'});
      }
    });

  }else {
    cb(400,{'error':'phone number not found'});
  }


}

handlers.tokens=function(data,cb)
{
    var methods=['POST','GET','PUT','DELETE'];
    if(methods.indexOf(data.method)> -1){
        handlers._tokens[data.method](data,cb);
    }else{
        cb(405);
    }
}

handlers._tokens={};

handlers._tokens.GET=function(data,cb){

  var id=typeof(data.queryStringObject.id=='string' && data.queryStringObject.id.trim().length==20)?data.queryStringObject.id.trim() : false;
    if(id){
    _data.read('tokens',id,function(err,data){
      if(!err && data){

        cb(200,data);
      }else {
        cb(400,{'error':'not a specifed id'});
      }
    })
  }else {
    cb(400,{'error':'id number not found'});
  }

}

handlers._tokens.POST=function(data,cb){

  var phone=typeof(data.payload.phone)=='string' && data.payload.phone.trim().length==10?data.payload.phone.trim() : false;
  var password=typeof(data.payload.password)=='string' && data.payload.password.trim().length>0?data.payload.password.trim() : false;
  if(phone && password){
    _data.read('users',phone,function(err,data){
      if(!err){
        var hashpassword=helpers.hash(password);
        if(hashpassword==data.hashpassword){
          var tokenid=helpers.createtoken(20);
          var expire=Date.now()+1000*60*60;
          var tokenobject={
            'phone':phone,
            'tokenid':tokenid,
            'expire':expire
          };
          _data.create('tokens',tokenid,tokenobject,function(err){
            if(!err){
              cb(200,tokenobject);
            }else {
              cb(500,{'error':'couldnot create token'});
            }
          })
        }else {
          cb(400,{'error':'password not matched'})
        }
      }else {
        cb(400,{'error':'phonenumber not matched'});
      }
    })

  }else {
    cb(400,{'error':'phonenumber and passsword needed'});
  }

}

//expries time incres to 1 hour
handlers._tokens.PUT=function(data,cb){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
 var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
 if(id && extend){
   // Lookup the existing token
   _data.read('tokens',id,function(err,tokenData){
     if(!err && tokenData){

       if(tokenData.expire > Date.now()){

         tokenData.expire = Date.now() + 1000 * 60 * 60;
               _data.update('tokens',id,tokenData,function(err){
           if(!err){
             cb(200);
           } else {
             cb(500,{'Error' : 'Could not update the token\'s expiration.'});
           }
         });
       } else {
         cb(400,{"Error" : "The token has already expired, and cannot be extended."});
       }
     } else {
       cb(400,{'Error' : 'Specified user does not exist.'});
     }
   });
 } else {
   cb(400,{"Error": "Missing required field(s) or field(s) are invalid."});
}
}

handlers._tokens.DELETE=function(data,cb){

  var id=typeof(data.queryStringObject.id=='string' && data.queryStringObject.id.trim().length==20)?data.queryStringObject.id.trim() : false;
  if(id){
    _data.read('tokens',id,function(err,data){
      if(!err && data){
        _data.delete('tokens',id,function(err){
          if(!err){
            cb(200);
          }else {
            cb(500,{'error':'unable to delete'});
          }
        });
      }else {
        cb(400,{'error':'not found'})
      }
    })
  }else {
    cb(400,{'error':'id number not found'})
  }

}

handlers._tokens.verify=function(id,phone,cb){
  _data.read('tokens',id,function(err,tokendata){
    if(!err && tokendata){
      if(tokendata.phone==phone && tokendata.expire > Date.now()){
        cb(true)
      }else {
        cb(false);
      }
    }else {
      cb(false);
    }
  });
}

handlers.checks=function(data,cb)
{
    var methods=['POST','GET','PUT','DELETE'];
    if(methods.indexOf(data.method)> -1){
        handlers._checks[data.method](data,cb);
    }else{
        cb(405);
    }
}

handlers._checks={};

//should havr protocol , url ,method , sucsescode and timeoutseconds
 handlers._checks.POST=function(data,cb){
   var protocol=typeof(data.payload.protocol)=="string" && ['https','http'].indexOf(data.payload.protocol) > -1 ?data.payload.protocol:false;
   var url=typeof(data.payload.url)=="string" && data.payload.url.length > 0?data.payload.url:false;
   var method=typeof(data.payload.method)=="string" && ['GET','PUT','POST','DELETE'].indexOf(data.payload.method) > -1?data.payload.method:false;
   var successcodes = typeof(data.payload.successcodes) == 'object' && data.payload.successcodes instanceof Array && data.payload.successcodes.length > 0 ? data.payload.successcodes  : false;
   var timeoutseconds = typeof(data.payload.timeoutseconds) == 'number' && data.payload.timeoutseconds % 1 === 0 && data.payload.timeoutseconds >= 1 && data.payload.timeoutseconds <= 5 ? data.payload.timeoutseconds : false;

//   console.log(protocol+url+method,successcodes+timeoutseconds);

   if(protocol && url && method && successcodes && timeoutseconds){

     var token=typeof(data.headers.token)=='string' && data.headers.token.trim().length==20?data.headers.token:false;
     //console.log(token);
     if(token){
       _data.read('tokens',token,function(err,tokendata){
         if(!err && tokendata){
          var phone=tokendata.phone;
          _data.read('users',phone,function(err,userdata){
            if(!err && userdata){
               var userchecks=typeof(userdata.checks)=='object' && userdata.checks instanceof Array  ? userdata.checks : [];
               if(userchecks.length < config.maxchecks){
                 console.log(userchecks);
                 var checkid=helpers.createtoken(20);
                 var checkobject={
                   'checkid':checkid,
                   'phone':phone,
                   'protocol':protocol,
                   'url':url,
                   'method':method,
                   'successcodes':successcodes,
                   'timeoutseconds':timeoutseconds
                 };
                 _data.create('checks',checkid,checkobject,function(err){
                   if(!err){
                     userdata.checks=userchecks;
                     userdata.checks.push(checkid);
                     _data.update('users',phone,userdata,function(err){
                       if(!err){
                         cb(200,checkobject);
                       }else {
                         cb(400,{'error':'cannot upate userdata'});
                       }
                     });
                   }else {
                     console.log(err);
                     cb(400,{'error':'cannot create check '});
                   }
                 });


               }else {
                 cb(400,{'error':'checks limit is over'});
               }
            }else {
              cb(400,{'error':'no user data with the mentioned data'});
            }
          });
         }else {
          cb(400,{'error':'not data withnthat token'});
         }
       });
     }else {
       cb(400,{'error':'invalid token'});
     }

   }else {
     cb(400,{'error':'input parametrs are missing'});
   }
}

handlers._checks.GET=function(data,cb){

  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
if(id){
_data.read('checks',id,function(err,checkdata){
  if(!err && checkdata){
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    handlers._tokens.verify(token,checkdata.phone,function(tokenIsValid){
      if(tokenIsValid){
        cb(200,checkdata);
      } else {
        cb(403,{"Error" : "Missing required token in header, or token is invalid."})
      }
    });
  }else {
    cb(400);
  }
})


} else {
  cb(400,{'Error' : 'Missing required field'})
}

}


handlers._checks.PUT=function(data,cb){

  var id=typeof(data.payload.id)=='string' && data.payload.id.trim().length>0?data.payload.id.trim() : false;
  var protocol=typeof(data.payload.protocol)=="string" && ['https','http'].indexOf(data.payload.protocol) > -1 ?data.payload.protocol:false;
  var url=typeof(data.payload.url)=="string" && data.payload.url.length > 0?data.payload.url:false;
  var method=typeof(data.payload.method)=="string" && ['GET','PUT','POST','DELETE'].indexOf(data.payload.method) > -1?data.payload.method:false;
  var successcodes = typeof(data.payload.successcodes) == 'object' && data.payload.successcodes instanceof Array && data.payload.successcodes.length > 0 ? data.payload.successcodes  : false;
  var timeoutseconds = typeof(data.payload.timeoutseconds) == 'number' && data.payload.timeoutseconds % 1 === 0 && data.payload.timeoutseconds >= 1 && data.payload.timeoutseconds <= 5 ? data.payload.timeoutseconds : false;

  if(id){
      if(protocol || url || method || successcodes || timeoutseconds){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        _data.read('checks',id,function(err,checkdata){
          if(!err && checkdata){
            handlers._tokens.verify(token,checkdata.phone,function(tokenIsValid){
              if(tokenIsValid){
                checkdata.protocol=protocol;
                checkdata.url=url;
                checkdata.method=method;
                checkdata.sucsescodes=successcodes;
                checkdata.timeoutseconds=timeoutseconds;
                _data.update('checks',id,checkdata,function(err){
                  if(!err)
                  {
                    cb(200);
                  }else {
                    cb(400);
                  }
                })
              }else {
                cb(400,{'error':'token not valid'});
              }
            });

          }else {
            cb(400);
          }
        })


      }else {
        cb(400,{'error':'field nor mentioned'});
      }
  }else {
    cb(400,{'error':'phone number not mentioned'});
  }
}


handlers._checks.DELETE=function(data,cb){


  var id=typeof(data.queryStringObject.id=='string' && data.queryStringObject.id.trim().length==20)?data.queryStringObject.id.trim() : false;
  if(id){
    _data.read('checks',id,function(err,checkdata){
      if(!err && checkdata){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verify(token,checkdata.phone,function(tokenIsValid){
          if(tokenIsValid){
            _data.delete('checks',id,function(err){
              if(!err){
                  _data.read('users',checkdata.phone,function(err,userdata){
                    if(!err && userdata){
                      var userchecks=typeof(userdata.checks)=='object' && userdata.checks instanceof Array  ? userdata.checks : [];
                      var checkposition=userchecks.indexOf(id);
                      if(checkposition > -1){
                        userchecks.splice(checkposition,1);
                        userdata.checks=userchecks;
                        _data.update('users',checkdata.phone,userdata,function(err){
                          if(!err){
                            cb(200);
                          }else {
                            cb(400,{'error':'not updated'});
                          }
                        });
                      }else {
                        cb(400,{'error':'cannot find the check'});
                      }
                    }else {
                      cb(400);
                    }
                  });
              }else {
                cb(400);
              }
            });
          }else {
            cb(400,{'error':'token not valid'});
          }
        });

      }else {
        cb(400);
      }
    });

  }else {
    cb(400,{'error':'phone number not found'});
  }


}







handlers.tarun = function(data,cb){
    cb(406,{'name':'tarun love bhavana'});
};
handlers.bhavana = function(data,cb){
    cb(406,{'name':'bhavana love tarun'});
};

handlers.notFound = function(data,cb){
  cb(404);
};

handlers.ping=function(data,cb){
    cb(200);
}


//html pages routues

handlers.index=function(data,cb){
  if(data.method=='GET'){
    helpers.gettemplate('index',function(err,string){
      if(!err && string){
        cb(200,string,'html');
      }else {
        cb(500,undefined,'html');
      }
    })
  } else {
    cb(405,undefined,'html');
  }
}

module.exports=handlers;

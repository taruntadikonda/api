var environments={};

environments.stagging={

    'httpport':8000,
    'httpsport':8001,
    'env':'stagging',
    'hasingsecert':'thisisaseert',
    'maxchecks':5,
    'twilio':{
      'phone':'+17173569974',
      'auth':'549c6846a3a8d46f24078e9497fab8a6',
      'account':'AC2fb321fbab74011f14acd96dbb04c854'
    },
    'templateGlobals' : {
    'appName' : 'tarun Bhavana',
    'companyName' : 'tarun bhavana, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:8000/'
}
};


environments.production={

    'httpport':5000,
    'httpsport':5001,
    'env':'production',
    'hasingsecert':'thisisalsoasecert',
    'maxchecks':5,
    'twilio':{
      'phone':'+17173569974',
      'auth':'549c6846a3a8d46f24078e9497fab8a6',
      'account':'AC2fb321fbab74011f14acd96dbb04c854'
    },
    'templateGlobals' : {
    'appName' : 'UptimeChecker',
    'companyName' : 'NotARealCompany, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:5000/'
}
};


var currentenvironment=typeof(process.env.NODE_ENV)=='string'?process.env.NODE_ENV.toLowerCase():'';
console.log(currentenvironment);
var environmenttoexport=typeof(environments[currentenvironment])=='object'?environments[currentenvironment]: environments.stagging;


module.exports=environmenttoexport;

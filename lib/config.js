var environments={};

environments.stagging={

    'httpport':8000,
    'httpsport':8001,
    'env':'stagging',
    'hasingsecert':'thisisaseert',
    'maxchecks':5
};


environments.production={

    'httpport':5000,
    'httpsport':5001,
    'env':'production',
    'hasingsecert':'thisisalsoasecert',
    'maxchecks':5
};


var currentenvironment=typeof(process.env.NODE_ENV)=='string'?process.env.NODE_ENV.toLowerCase():'';
console.log(currentenvironment);
var environmenttoexport=typeof(environments[currentenvironment])=='object'?environments[currentenvironment]: environments.stagging;


module.exports=environmenttoexport;

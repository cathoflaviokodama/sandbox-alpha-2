const qs = require('querystring');
const vm = require('vm');
const readline = require('readline');
const express = require('express');
const request = require('request');
var server = express();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var app = {
    shell : true
};
var sandbox = {
    console : {
        log : function() {
            var args = [];
            for(var x = 0; x < arguments.length;x++) args.push(arguments[x]);
            console.log("-------------------------------------------------------------------------------");
            return console.log.apply(console,args);
        }
    },
    request : request,
    reql : function(path,args) {
        if(args) {
            request.post('http://localhost:9090'+path,{form:args},(e,r,b) =>{
                console.log(b);
            });
        } else {
            request('http://localhost:9090'+path,(e,r,b) =>{
                console.log(b);
            });
        }
    },
    quit : () => {
        
        app.shell = false;
    }
};
sandbox.routes = require('./routes.js');
function route(req,res,post) {
    var parts = req.url.split('?');
    var found = true;
    if(parts.length>0) {
        var base_parts = parts[0].split("/");
        base_parts.shift();
        var p = sandbox.routes;
        for(var x = 0; x < base_parts.length;x++) {
            console.log(x,base_parts[x]);
            if( base_parts[x] in p ) {
                p = p[ base_parts[x] ];
            } else {
                found = false;
                break;
            }
        }
        if(found) {
            var type = Object.prototype.toString.apply(p);
            switch(type) {
                case "[object Number]":
                case "[object String]":
                    res.end(p);
                    break;
                case "[object Function]":
                    p(req,res,{post:post});
                    break;
                case "[object Object]":
                    res.json(p);
                    break;

            }
        }
    }
    if(!found) res.status(404).end(req.url);

}
server.get("/*",(req,res) => {
    route(req,res,{});
});
server.post("/*",(req,res) => {
    var body = [];
    req.on('data', function (data) {
        body.push(data);
        // 1MB input
        if (body.length > 1e6) req.connection.destroy();
    });
    req.on('end', function () {
        var post = qs.parse(body.join(""));
        route(req,res,post);
    });
});
app.server = server.listen(9090);
app.quit = function() { rl.close(); app.server.close(); };
process.on('SIGTERM', () => { app.quit(); });
process.on('SIGINT', () => { app.quit(); });
function shell() {
    rl.question('>', (answer) => {
        try {
            const script = new vm.Script(answer);
            const context = vm.createContext(sandbox);
            script.runInContext(context);
        } catch(e) {
            console.log(e);
        }
        if(app.shell) setTimeout(()=> { shell(); },0);
        else app.quit();
    });
}
shell();
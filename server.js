const express = require('express');
const fs = require('fs');
const app = express();
const port = 6969;

app.get('/', function(request, response){
    var check = verify(request.query.user, request.query.key);
    
    
    response.send(check);
    response.end();

    var timeNow = new Date();
    if(check){
        console.log(timeNow.toUTCString() + '>>  ' + request.query.user + ' ' + request.query.key + ': licensed' + '\n');
    }
    else{
        console.log(timeNow.toUTCString() + '>>  ' + request.query.user + ' ' + request.query.key + ': unlicensed' + '\n');
    }
    
});

app.get('/add', function(req, res){
    if(req.query.secret == 'getBread1'){
        addLicense(req.query.user, req.query.type, req.query.key);
        console.log('success');
        res.end('success');
        return;
    }
    console.log('failed');
    res.end('failed');
});

app.listen(port, function(){
console.log('Server ready :)');
});

function verify(user, key){
    var users = fs.readFileSync('users.json');
    var jsonContent = JSON.parse(users);
    console.log(user + ": " + JSON.stringify(jsonContent[user]));
    return jsonContent[user].key === key;
}

function addLicense(user, type, key){
var text = fs.readFileSync('users.json', 'utf8');
var cut = text.substring(0, text.length - 2);
var full = cut + '\n\n"' + user + '":{\n"key":"' + key + '",\n"licenseType":"' + type + '",\n"dateAdded":""\n},\n\n}';
fs.writeFileSync('users.json', full);
}

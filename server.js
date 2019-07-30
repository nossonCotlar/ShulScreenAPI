const express = require('express');
const fs = require('fs');
const app = express();
const port = 6969;

app.get('/', function(request, response){
    //response.send('Hello World');
    var check = verify(request.query.user, request.query.key);
    
    
    response.send(check);
    response.end();

    var timeNow = new Date();
    if(check){
        console.log(timeNow.toUTCString() + '>>' + request.query.user + ' ' + request.query.key + ': licensed' + '\n');
    }
    else{
        console.log('\x1b[33m%s\x1b[0m' + timeNow.toUTCString() + '>>' + request.query.user + ' ' + request.query.key + ': unlicensed' + '\n');
    }
    
});

app.listen(port, function(){
console.log('Server ready :)');
});

function verify(user, key){
    var users = fs.readFileSync('users.json');
    var jsonContent = JSON.parse(users);
    return jsonContent[user].key === key;
}
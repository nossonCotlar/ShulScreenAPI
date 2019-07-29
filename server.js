const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.get('/', function(request, response){
    //response.send('Hello World');
    var check = verify(request.query.user, request.query.key);
    
    console.log(request.query.user + ' ' + request.query.key + ': ' + check + '\n');
    response.send(check);
    response.end();
});

app.listen(port, function(){
console.log('Server ready :)');
});

function verify(user, key){
    var users = fs.readFileSync('users.json');
    var jsonContent = JSON.parse(users);
    return jsonContent[user].key === key;
}
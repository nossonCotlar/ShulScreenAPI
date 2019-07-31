const express = require('express');
const fs = require('fs');
const app = express();
const port = 6969;

app.get('/', function(request, response){
    var check = verify(request.query.user, request.query.key); //as of now it accepts requests made as URL queries, will switch to params later
    
    
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

app.get('/add/:secret/:user/:key/:type', function(req, res){
    if(req.params.secret == 'getBread1'){
        addLicense(req.params);
        
        res.end('User has been added!' + JSON.stringify(req.params, null, 2));
        return;
    }
    console.log('secret was incorrect');
    res.end('secret was incorrect');
});

app.listen(port, function(){
console.log('Server ready :)');
});

function verify(user, key){
    var users = fs.readFileSync('new.json', 'utf8'); //reads file data
    var jsonContent = JSON.parse(users); //make it json
    var jsonSingle; //this will later store the object we will check

    for(var i = 0; i < jsonContent.length; i++){
        if(jsonContent[i].user == user){ //check if the user from the request query mathces the user field in the current object from file
            jsonSingle = jsonContent[i]; //if so, make it the object we will analyze
            break;
        }
    }
    return(jsonSingle.key === key); //return whether the key from request query matches the single object's key
    
}

function addLicense(params){
var text = fs.readFileSync('new.json', 'utf8'); //reads file data
var jsonFile = JSON.parse(text); //make it json
delete params.secret; //make sure the secret field doesnt get saved

params.dateAdded = (new Date()).toUTCString(); //add the current time to the object

jsonFile.push(params); //add the object to the array from file
var string = JSON.stringify(jsonFile, null, 2); //format object to text 
fs.writeFileSync('new.json', string); //save

console.log('User has been added!' + JSON.stringify(params, null, 2));

}

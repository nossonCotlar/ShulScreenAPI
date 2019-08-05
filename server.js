const productVersion = 'alpha.1.3';

const express = require('express');
var parser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 6969;
const secret = 'getBread1';

app.use('/add', express.static('public'));
app.use(parser.urlencoded({extended: false}));
app.use(parser.json());


app.get('/verify', function(request, response){
    var check = verify(request.query.user, request.query.key); //as of now it accepts requests made as URL queries, will switch to params later
    
    
    response.send(check);
    response.end();

    if(check){
        console.log(request.ip + ' >>  ' + request.query.user + ' ' + request.query.key + ': licensed' + '\n');
    }
    else{
        console.log(request.ip + ' >>  ' + request.query.user + ' ' + request.query.key + ': unlicensed' + '\n');
    }
    
});

app.post('/postadd', addLicenseFromPost);

app.get('/version', versionCheck);

app.listen(port, function(){
console.log('Listening on ' + port + '...');
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
    if(jsonSingle == undefined) return false;
    return(jsonSingle.key === key); //return whether the key from request query matches the single object's key
    
}

function addLicenseFromPost(request, response){
    
    var objToAdd = request.body;
    //console.log(objToAdd);
    if(objToAdd.secret != secret){
        response.end('secret is incorrect');
        console.log(objToAdd.secret);
        console.log('License addition attempted: incorrect secret');
        return;
    }
    delete objToAdd.secret;
    objToAdd.dateAdded = (new Date()).toUTCString();

    var text = fs.readFileSync('new.json', 'utf8'); //reads file data
    var jsonFile = JSON.parse(text); //make it json
    jsonFile.push(objToAdd);
    var jsonFileString = JSON.stringify(jsonFile, null, 2);
    fs.writeFileSync('new.json', jsonFileString);

    response.end('User has been added!\n' + JSON.stringify(objToAdd, null, 2));
    console.log('User has been added!\n' + JSON.stringify(objToAdd, null, 2));
    
}

function versionCheck(request, response){
response.end(productVersion);
}
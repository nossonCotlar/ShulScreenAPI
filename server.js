const productVersion = 'beta.1.0';
const zmanimURL = 'https://api.myzmanim.com/engine1.json.aspx';
const zmanimUser = '0010921043';
const zmanimKey = 'ff71bd8bec18ecc3a6716ca8e6462f52646b8a774d1b292d63d37ee9618cede940d4ae97277af79d';

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const express = require('express');
var https = require('https');
var parser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 6969;
const secret = 'getBread1';

/*
https.createServer({
    key: fs.readFileSync('ssl/ssl.key'), 
    cert: fs.readFileSync('ssl/ssl.cert')
}, app).listen(3000);
*/


app.use('/add', express.static('addLicense'));
app.use('/', express.static('public'));
app.use(parser.urlencoded({ extended: false }));
app.use(parser.json('application/json'));
//app.use(parser.text('text/plain'));

app.post('/mainPost', mainPost);

app.post('/postadd', addLicenseFromPost);

app.post('/textSubmit', addToPendingSyncs);


app.listen(port, function () {
    console.log('Listening on ' + port + '...');
});

function mainPost(request, response){
    console.log(request.body);

    var parsha, donors, announcements, memorial;
    try{ //try to set the parsha value to the requested path
        parsha = fs.readFileSync('parsha/' + request.body.parsha + '/' + request.body.dayOfWeek + '.txt', 'ascii');
    } catch { //if it fails set it to null
        parsha = null;
    }

    var pendingSyncs = JSON.parse(fs.readFileSync('pendingSyncs.json', 'ascii'));

    for(var i = 0; i < pendingSyncs.length; i++){
        if(pendingSyncs[i].user == request.body.user && pendingSyncs[i].key == request.body.key){
            switch(pendingSyncs[i].selection){
                case 'donors': donors = pendingSyncs[i].text; break;
                case 'announcements': announcements = pendingSyncs[i].text; break;
                case 'memorial': memorial = pendingSyncs[i].text; break;

            }
            pendingSyncs.splice(i, 1);
            i--;
        }
    }

    fs.writeFileSync('pendingSyncs.json', JSON.stringify(pendingSyncs, null, 2));

    var jsonResponse = {
        verify: verify(request.body.user, request.body.key), 
        updateAvailable: request.body.version !== productVersion, 
        parsha: parsha, 
        zmanim: zmanimPost(request.body.postalCode, request.body.dateString), 
        donors: donors, 
        announcements: announcements, 
        memorial: memorial
    };

    response.send(JSON.stringify(jsonResponse, null, 2));
    //console.log('sent to:' + request.ip + '\n' + JSON.stringify(jsonResponse, null, 2));

}

function addToPendingSyncs(request, response) {
    var data = request.body;

    //verify user
    var users = JSON.parse(fs.readFileSync('new.json'));
    for (var i = 0; i < users.length; i++) {
        if (users[i].user == data.user) {
            if (users[i].key == data.key) {
                break;
            }
            else {
                response.end('Couldn\'t submit: Incorrect user/key');
                console.log('Couldn\'t submit: Incorrect user/key');
                return;
            }
        }
        if (i == users.length - 1) {
            response.end('Couldn\'t submit: User not found');
            console.log('Couldn\'t submit: User not found');
            return;
        }
    }

    var toPush = {
        user: data.user,
        key: data.key,
        selection: data.selection,
        text: data.text
    }
    var raw = fs.readFileSync('pendingSyncs.json');
    var jsonPendings = JSON.parse(raw);

    //check for existing submissions
    for (var i = 0; i < jsonPendings.length; i++) {
        if (jsonPendings[i] == null) continue;
        if (jsonPendings[i].user == toPush.user && jsonPendings[i].selection == toPush.selection) {
            jsonPendings.splice(i, 1);
            console.log(JSON.stringify(jsonPendings, null, 2));
            console.log("replaced existing submission");
            break;
        }
    }
    jsonPendings.push(toPush);
    var toWrite = JSON.stringify(jsonPendings, null, 2);
    fs.writeFileSync('pendingSyncs.json', toWrite);
    response.end("Submission Successful: \n" + JSON.stringify(toPush, null, 2));
    console.log("Submission Successful: \n" + JSON.stringify(toPush, null, 2));
}
function verify(user, key) {
    var users = fs.readFileSync('new.json', 'utf8'); //reads file data
    var jsonContent = JSON.parse(users); //make it json
    var jsonSingle; //this will later store the object we will check

    for (var i = 0; i < jsonContent.length; i++) {
        if (jsonContent[i].user == user) { //check if the user from the request query mathces the user field in the current object from file
            jsonSingle = jsonContent[i]; //if so, make it the object we will analyze
            break;
        }
    }
    if (jsonSingle == undefined) return false;
    return (jsonSingle.key === key); //return whether the key from request query matches the single object's key

}
function addLicenseFromPost(request, response) {

    var objToAdd = request.body;
    //console.log(objToAdd);
    if (objToAdd.secret != secret) {
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

function zmanimPost(postalCode, dateString){
    var xhr = new XMLHttpRequest();
    var params = 'coding=JS&language=en' + 
    '&locationid=US' + postalCode + 
    '&inputdate=' + dateString + 
    '&key=' + zmanimKey + 
    '&user=' + zmanimUser;

    xhr.open('POST', zmanimURL + '/getDay', false);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(params);

    return xhr.responseText;

}


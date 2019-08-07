const productVersion = 'alpha.1.5';

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
app.use(parser.json());


app.get('/verify', verifyWrapper);

app.post('/postadd', addLicenseFromPost);

app.post('/textSubmit', addToPendingSyncs);

app.get('/textPull/:user/:key', sendSubmissionToClient);

app.get('/parsha/:parsha/:day', sendParshaContent)

app.get('/version', versionCheck);

app.listen(port, function () {
    console.log('Listening on ' + port + '...');
});


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

function sendSubmissionToClient(request, response) {
    var objToSend = {available: false};
    var pendingSyncs = JSON.parse(fs.readFileSync('pendingSyncs.json'));
    for (var i = 0; i < pendingSyncs.length; i++) {
        if (pendingSyncs[i] == null) continue;
        if (pendingSyncs[i].user == request.params.user && pendingSyncs[i].key == request.params.key) {
            objToSend.available = true;
            objToSend.selection = pendingSyncs[i].selection;
            objToSend.text = pendingSyncs[i].text;
            pendingSyncs.splice(i, 1);
            fs.writeFileSync('pendingSyncs.json', JSON.stringify(pendingSyncs, null, 2));
            break;
        }
        
    }
    response.end(JSON.stringify(objToSend, null, 2));
    //if(objToSend.available == false) console.log("nothing was available");
    if(objToSend.available == true) console.log("Sent Sync Content to client and deleted from Database: \n" + 
    JSON.stringify(objToSend, null, 2));
}

function verifyWrapper(request, response) {
    var check = verify(request.query.user, request.query.key); //as of now it accepts requests made as URL queries, will switch to params later


    response.send(check);
    response.end();

    if (check) {
        console.log(request.ip + ' >>  ' + request.query.user + ' ' + request.query.key + ': licensed' + '\n');
    }
    else {
        console.log(request.ip + ' >>  ' + request.query.user + ' ' + request.query.key + ': unlicensed' + '\n');
    }
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

function sendParshaContent(request, response){
    var parshaPath = 'parsha/' + request.params.parsha + '/' + request.params.day + '.txt';
    var parshaFile = fs.readFileSync(parshaPath, 'ascii');
    response.end(parshaFile);
    //console.log(parshaFile);
    console.log('Sent parsha content in: ' + parshaPath + ' to: ' + request.ip)
}

function versionCheck(request, response) {
    response.end(productVersion);
}
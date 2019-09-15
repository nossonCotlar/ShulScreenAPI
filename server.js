"use strict";

const productVersion = 'beta.1.1';
const zmanimURL = 'https://api.myzmanim.com/engine1.json.aspx';
const zmanimUser = '0010921043';
const zmanimKey = 'ff71bd8bec18ecc3a6716ca8e6462f52646b8a774d1b292d63d37ee9618cede940d4ae97277af79d';

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const express = require('express');
var https = require('https');
var parser = require('body-parser');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 6969;
const secret = 'getBread1';

var writer = fs.createWriteStream('./logs');

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

    var parsha, donors, announcements, memorial;
    try{ //try to set the parsha value to the requested path
        parsha = fs.readFileSync('parsha/' + request.body.parsha + '/' + request.body.dayOfWeek + '.txt', 'ascii');
    } catch(e) { //if it fails set it to null
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

    fs.writeFile('pendingSyncs.json', JSON.stringify(pendingSyncs, null, 2), writeErr);

    var jsonResponse = {
        verify: verify(request.body.user, request.body.key), 
        updateAvailable: request.body.version !== productVersion, 
        parsha: parsha, 
        zmanim: zmanimPost(request.body.postalCode, request.body.dateString, request.body.latitude, request.body.longitude), 
        donors: donors, 
        announcements: announcements, 
        memorial: memorial
    };

    response.send(JSON.stringify(jsonResponse, null, 2));
    writer.write((new Date()).toUTCString() + '\n' + 'content sent to: ' + request.body.user + '-' + request.body.key + ' @ ' + request.ip + '\n\n');

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
                return;
            }
        }
        if (i == users.length - 1) {
            response.end('Couldn\'t submit: User not found');
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
            writer.write(JSON.stringify(jsonPendings, null, 2));
            writer.write(" replaced existing submission\n\n");
            break;
        }
    }
    jsonPendings.push(toPush);
    var toWrite = JSON.stringify(jsonPendings, null, 2);
    fs.writeFile('pendingSyncs.json', toWrite, writeErr);
    response.end("Submission Successful: \n" + JSON.stringify(toPush, null, 2));
    writer.write((new Date()).toUTCString() + "Submission Successful: \n" + JSON.stringify(toPush, null, 2)) + '\n\n';
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
    fs.writeFile('new.json', jsonFileString, writeErr);

    response.end('User has been added!\n' + JSON.stringify(objToAdd, null, 2));
    writer.write((new Date()).toUTCString() + 'User has been added!\n' + JSON.stringify(objToAdd, null, 2)) + '\n\n';

}

function zmanimPost(postalCode, dateString, lat, long){
    var xhr = new XMLHttpRequest();
    var locationID;
    if(postalCode) locationID = JSON.parse(locationByPostal(postalCode)).LocationID;
    else if(lat && long) locationID = JSON.parse(locationByGPS(lat, long)).LocationID;
    var params = 'coding=JS&language=en' + 
    '&locationid=' + locationID + 
    '&inputdate=' + dateString + 
    '&key=' + zmanimKey + 
    '&user=' + zmanimUser;

    xhr.open('POST', zmanimURL + '/getDay', false);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(params);

    return xhr.responseText;

}

function locationByPostal(postal){
    var xhr = new XMLHttpRequest();
    var params = 'coding=JS&language=en' + 
    '&query=' + postal + 
    '&key=' + zmanimKey + 
    '&user=' + zmanimUser;
    xhr.open('POST', zmanimURL + '/searchPostal', false);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(params);

    return xhr.responseText;
}
function locationByGPS(lat, long){
    var xhr = new XMLHttpRequest();
    var params = 'coding=JS&language=en' + 
    '&latitude=' + lat + 
    '&longitude=' + long + 
    '&key=' + zmanimKey + 
    '&user=' + zmanimUser;
    xhr.open('POST', zmanimURL + '/searchGps', false);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(params);
    return xhr.responseText;
}

function writeErr(err){
    if(err){
        writer.write((new Date()).toUTCString() + ':' + err + '\n\n');
    }
}


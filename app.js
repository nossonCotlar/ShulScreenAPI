const express = require('express');
const app = express();
const parser = require('body-parser');
const port = 8080;

//app.use(parser.json('application/x-www-form-urlencoded')); //set the json content type option for body-parser
//app.use(parser.text('application/x-www-form-urlencoded'));
app.use(parser.urlencoded({extended: false}));

app.post('/', function(request, response){ //this method responds to requests made to the server URL with no additional paths
    console.log(request.body.firstValue); //log the request body (parsed with body-parser) (stringified with indentation format to make reading it easier)
    response.send(JSON.stringify(request.body)); //send the received body (casted to string) pack to client
    response.end(); //terminate response
});

app.listen(port, function(){
    console.log('server is listening on ' + port);
}); //make the server listen on specified port




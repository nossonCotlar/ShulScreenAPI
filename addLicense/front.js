var xhr = new XMLHttpRequest();

var userInput = document.getElementById("user");
var keyInput = document.getElementById("key");
var secretInput = document.getElementById("secret");
var typeInput = document.getElementById("type");
var submitButton = document.getElementById("submit");

submitButton.onclick = function(){
    
    var data = {
        user: userInput.value, 
        key: keyInput.value,
        type: typeInput.value, 
        secret: secretInput.value
    };


    xhr.open("POST", "/postadd", true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  
    // send the collected data as JSON
    xhr.send(JSON.stringify(data));
    
}

xhr.onloadend = function(){
    document.write(xhr.response);
}

  
var xhr = new XMLHttpRequest();

var userField = document.getElementById("user");
var keyField = document.getElementById("key");
var textEntry = document.getElementById("textEntry");
var selection = document.getElementsByName("selectArea");

function submit() {

    if(userField.value == undefined || 
        keyField.value == undefined || 
        textEntry.value == undefined ||
        checkedButton() == undefined){
            fillInAllFields();
            return;
        }

    var data = {
        user: userField.value,
        key: keyField.value,
        selection: checkedButton(),
        text: textEntry.value
    }

    xhr.open("POST", "/textSubmit", true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    // send the collected data as JSON
    xhr.send(JSON.stringify(data));

}

xhr.onloadend = function () {
    document.write(xhr.response);
    document.write("\n");
    var btn = document.createElement("BUTTON");
    btn.innerHTML = "Back";
    document.body.append(btn);

    btn.onclick = function () {
        location.reload();
    }
}

function checkedButton() {
    for (var i = 0; i < selection.length; i++) {
        if (selection[i].checked) return selection[i].value;
    }
}

function fillInAllFields(){
    document.write("You must fill in all fields");
    document.write("\n");
    var btn = document.createElement("BUTTON");
    btn.innerHTML = "Back";

    document.body.append(btn);

    btn.onclick = function () {
        location.reload();
    }
}
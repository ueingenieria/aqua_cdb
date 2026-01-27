var boton_login = document.getElementById("go_login");
var boton_logup = document.getElementById("go_logup");

presentacion_off = function() {
    if (localStorage.getItem("logued") === "true") {
        location.replace("login.html");
    } else {
        document.getElementById("presentacion").style.cssText = 'display: none;';
        document.getElementById("inicio").style.cssText = 'display: block;';
        document.addEventListener("backbutton", function() { navigator.app.exitApp() }, true);
    }
}


boton_login.onclick = function() {
    location.replace("login.html");
}

boton_logup.onclick = function() {
    location.replace("logup.html");
}


function init() {
    Keyboard.hide();
    $("html").height($(document).height());
    // $("body").fadeIn(250);
}

window.onload = function() {
    setTimeout(presentacion_off, 1500);
    init()
}

document.addEventListener("backbutton", function() { navigator.app.exitApp() }, true);
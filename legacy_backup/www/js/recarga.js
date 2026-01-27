var cargar = document.getElementById("bot_cargar");
var monto = document.getElementById("monto");
var label_pesos = document.getElementById("label_pesos");
var label_puntos = document.getElementById("label_puntos");
var email = "";
var mercadopago;
var enable_cordovaFetch
var bot_notif = document.getElementById("notificaciones");

function fetch1(url, opt) {
    if (enable_cordovaFetch == undefined)
        return fetch(url, opt);
    else
        return cordovaFetch(url, opt);
}

bot_notif.onclick = function() {

    Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 750,
        timerProgressBar: false,
        title: 'No tenés notificaciones',
        background: "#eff2f9"
    })

}

cargar.onclick = function() {

    if (monto.value < 10) {
        Swal.fire("", "No podes hacer una carga menor a $10", "warning")
    } else {
        localStorage.setItem("new_saldo", "1");

        email = localStorage.getItem("email");
        uname = localStorage.getItem("name");

        Swal.fire({
            text: "Esperá...",
            allowOutsideClick: false,
            width: "50%",
            onBeforeOpen: () => {
                Swal.showLoading()
            }
        })

        var params = "importe=" + monto.value + "&email=" + email + "&nombre=" + uname;
        return fetch1("https://www.aquaexpress.com.ar/aqua4d/aqua_pagos_mp/recargar.php", {
                method: 'POST',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded",
                },
                body: params
            })
            .then(function(response) {
                if (response.ok) {
                    return response.text()
                } else {
                    Swal.fire("Ups!", "Parece que no tenés conexión. Intentá de nuevo", "error")
                        .then(() => {
                            ir_a()
                        })
                }
            })
            .then(function(text) {
                var pattern = /^(http|https)\:\/\/[a-z0-9\.-]+\.[a-z]{2,4}/gi;

                if (text.match(pattern)) {
                    // Swal.close();
                    // window.location.href = text;
                    abrir_url(text);
                } else {
                    Swal.fire("Ups!", "Estamos teniendo problemas técnicos. Intentá de nuevo", "error")
                }

            })
            .catch(() => {
                Swal.fire("Ups!", "Estamos teniendo problemas técnicos. Intentá de nuevo", "error")
            })


    }

}

function abrir_url(url) {
    var target = "_blank";
    var options = "location=no,hidden=yes,hardwareback=no";
    mercadopago = cordova.InAppBrowser.open(url, target, options);
    mercadopago.addEventListener("loadstop", () => {
        Swal.close();
        mercadopago.show()
    });
    mercadopago.addEventListener("exit", ir_a);
}

function ir_a() {
    location.replace("loged.html");
}

window.onload = function() {

    label_pesos.innerHTML = "$ " + localStorage.getItem("pesos");
    label_puntos.innerHTML = localStorage.getItem("puntos");
    $("body").fadeIn(200);

}

$("#atras").click(function() {
    location.replace("loged.html")
})

document.addEventListener("backbutton", function() { location.replace("loged.html") }, true);
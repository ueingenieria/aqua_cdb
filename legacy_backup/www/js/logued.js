var cargar = document.getElementById("boton_carga");
var creditos = document.getElementById("boton_creditos");
var cod_qr = document.getElementById("boton_qr");
var map = document.getElementById("boton_ubicaciones");
var cupones = document.getElementById("boton_cupones");
var beneficios = document.getElementById("boton_beneficios");
var perfil = document.getElementById("boton_perfil");
var bot_sus = document.getElementById("banner1");
var card = document.getElementById('card_lavadero_cercano')
var lavadero = {}
var flagLavCercEnabled = false

// var bot_notif = document.getElementById("notificaciones");
var email, uname;
var precio_credito
var mercadopago
var enable_cordovaFetch
var actualPosition = {
    lat: 0,
    lon: 0,
    alt: 0,
    acc: 0,
    timestamp: 0
}
var watchID = null
var listLavaderos = []

function fetch1(url, opt) {
    if (enable_cordovaFetch == undefined)
        return fetch(url, opt);
    else
        return cordovaFetch(url, opt);
}

function abrir_url(url) {
    var target = "_blank";
    var options = "location=no,hidden=yes,hardwareback=no";
    mercadopago = cordova.InAppBrowser.open(url, target, options);
    mercadopago.addEventListener("loadstop", mostrar_web);
    //mercadopago.addEventListener("exit", ir_a);
}

function mostrar_web() {
    Swal.close();
    mercadopago.show();
}

card.onclick = () => {
    if (!flagLavCercEnabled) {
        navigator.geolocation.getCurrentPosition((position) => {
                console.debug('Initial position retrieved')
                actualPosition = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    acc: position.coords.accuracy,
                    alt: position.coords.altitude,
                    timestamp: position.timestamp
                }
                if (listLavaderos.length > 0) {
                    actualPosition.timestamp = position.timestamp
                    lavadero = lavaderoCercano(actualPosition, listLavaderos)
                    var distancia = distanciaLavadero(actualPosition, { lat: lavadero.latitud, lon: lavadero.longitud })
                    cardLavCercano(lavadero, distancia)
                }
            },
            (err) => {
                console.error(err)
            }, { maximumAge: 3000, timeout: 10000, enableHighAccuracy: true })
        flagLavCercEnabled = true;
        card.classList.remove('iniciar_navegacion')
        let lavaderoTag = document.getElementById('lavaderoTag')
        triggerLocationAnimation();
        lavaderoTag.innerHTML = "Buscando..."
        realtimePosition();
    } else {
        location.replace(`https://www.google.com/maps/dir/?api=1&origin=${actualPosition.lat}%2C${actualPosition.lon}&destination=${lavadero.latitud}%2C${lavadero.longitud}&travelmode=driving`)
    }
}

bot_sus.onclick = function() {
    window.open = cordova.InAppBrowser.open;
    window.open(`https://www.aquaexpress.com.ar/aqua4d/aqua_pagos_mp/checkout.html?email=${email}`, '_system')
}

perfil.onclick = function() {
    location.replace("datos.html");
}

beneficios.onclick = function() {
    location.replace("promociones.html");
}

cargar.onclick = function() {
    location.replace("recarga.html");
}

cod_qr.onclick = function() {
    if (!watchID) {
        Swal.fire({
            text: 'Veamos donde estás...',
            allowOutsideClick: false,
            onBeforeOpen: () => {
                Swal.showLoading()
            }
        });
        navigator.geolocation.getCurrentPosition((position) => {
                actualPosition = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    alt: position.coords.altitude,
                    acc: position.coords.accuracy,
                    timestamp: position.timestamp
                }
                var lavCercano = lavaderoCercano(actualPosition, listLavaderos.filter(l => l.tipo_lavadero == "4D"))
                const today = new Date()
                const times = SunCalc.getTimes(today, actualPosition.lat, actualPosition.lon, actualPosition.alt)
                location.replace(`qr.html?V1=${lavCercano.tipo_totem=='V1'}&TORCH=${today.getTime() > times.sunset.getTime() || today.getTime() < times.sunriseEnd.getTime()}`);
            },
            (err) => {
                console.error(err)
                Swal.close();
                location.replace('qr.html?V1=false');
            }, { maximumAge: 3000, timeout: 10000, enableHighAccuracy: true })
    } else {
        var lavCercano = lavaderoCercano(actualPosition, listLavaderos.filter(l => l.tipo_lavadero == "4D"))
        const today = new Date()
        const times = SunCalc.getTimes(today, actualPosition.lat, actualPosition.lon, actualPosition.alt)
        location.replace(`qr.html?V1=${lavCercano.tipo_totem=='V1'}&TORCH=${today.getTime() > times.sunset.getTime() || today.getTime() < times.sunriseEnd.getTime()}`);
    }
}

cupones.onclick = function() {
    location.replace("cupones.html");
}

label_pesos.onclick = function() {
    actualiza_precio_suscripcion();
}

creditos.onclick = function() {
    if (!watchID) {
        Swal.fire({
            text: 'Veamos donde estás...',
            allowOutsideClick: false,
            onBeforeOpen: () => {
                Swal.showLoading()
            }
        });
        navigator.geolocation.getCurrentPosition((position) => {
                actualPosition = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                }
                const url = `https://www.aquaexpress.com.ar/aqua4d/aqua_maps_compra_mp1.html?lat=${actualPosition.lat}&long=${actualPosition.lon}&zoom=17&mail=${email}&nombre=${uname}`;
                Swal.close();
                abrir(url);
            },
            (err) => {
                console.error(err)
                const url = `https://www.aquaexpress.com.ar/aqua4d/aqua_maps_compra_mp1.html?lat=${actualPosition.lat}&long=${actualPosition.lon}&zoom=17&mail=${email}&nombre=${uname}`;
                Swal.close();
                abrir(url);
            }, { maximumAge: 3000, timeout: 10000, enableHighAccuracy: true })
    } else {
        const url = `https://www.aquaexpress.com.ar/aqua4d/aqua_maps_compra_mp1.html?lat=${actualPosition.lat}&long=${actualPosition.lon}&zoom=17&mail=${email}&nombre=${uname}`;
        abrir(url);
    }
}

map.onclick = function() {
    if (!watchID) {
        Swal.fire({
            text: 'Veamos donde estás...',
            allowOutsideClick: false,
            onBeforeOpen: () => {
                Swal.showLoading()
            }
        });
        navigator.geolocation.getCurrentPosition((position) => {
                actualPosition = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                }
                const url = `https://www.aquaexpress.com.ar/aqua4d/aqua_maps3.html?lat=${actualPosition.lat}&long=${actualPosition.lon}&zoom=17&platform=${window.cordova.platformId}`;
                Swal.close();
                abrir(url);
            },
            (err) => {
                console.error(err)
                const url = `https://www.aquaexpress.com.ar/aqua4d/aqua_maps3.html?lat=${actualPosition.lat}&long=${actualPosition.lon}&zoom=17&platform=${window.cordova.platformId}`;
                Swal.close();
                abrir(url);
            }, { maximumAge: 3000, timeout: 10000, enableHighAccuracy: true })
    } else {
        const url = `https://www.aquaexpress.com.ar/aqua4d/aqua_maps3.html?lat=${actualPosition.lat}&long=${actualPosition.lon}&zoom=17&platform=${window.cordova.platformId}`;
        abrir(url);
    }
}

function realtimePosition() {
    watchID = navigator.geolocation.watchPosition(
        (position) => {
            console.log('RT position triggered')
            actualPosition = {
                ...actualPosition,
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                alt: position.coords.altitude,
                acc: position.coords.accuracy
            }
            if (listLavaderos.length > 0 && ((+actualPosition.timestamp + 4500) <= position.timestamp)) {
                actualPosition.timestamp = position.timestamp
                lavadero = lavaderoCercano(actualPosition, listLavaderos)
                var distancia = distanciaLavadero(actualPosition, { lat: lavadero.latitud, lon: lavadero.longitud })
                cardLavCercano(lavadero, distancia)
            }

        },
        (err) => {
            console.log(err)
            actualPosition = {
                lat: -32.890674,
                lon: -68.839440
            }
        }, { maximumAge: 3000, enableHighAccuracy: true }
    )
}

function cardLavCercano(lavadero, distancia) {
    let lavaderoTag = document.getElementById('lavaderoTag')
    let distanciaTag = document.getElementById('distanciaTag')
    let locationIcon = document.getElementById('locationIcon')
        // if (card.style.display == 'none') {
        //     card.style = ""
        // }
    lavaderoTag.innerHTML = lavadero.nombre
    distanciaTag.innerHTML = distancia
    locationIcon.classList.add('location_animation')
    triggerLocationAnimation();
}

function triggerLocationAnimation() {
    locationIcon.classList.add('location_animation')
    setTimeout(() => {
        locationIcon.classList.remove('location_animation')
    }, 2000)
}

function modulo(i, j) {
    return ((i ** 2) + (j ** 2));
}

function abrir(url) {
    var target = "_blank";
    var options = "location=no,hidden=yes,hardwareback=no,closebuttoncaption=Volver,hidenavigationbuttons=yes,hidespinner=yes,disallowoverscroll=yes,lefttoright=yes,presentationstyle=fullscreen,zoom=no";
    browser = cordova.InAppBrowser.open(url, target, options);
    browser.addEventListener("loadstop", () => {
        Swal.close();
        browser.show();
    });
}

function consulta_saldo() {
    const data = "accion=55&api_key=ojpEJmCMNjjfX0zRyrASOAWFpgOp2eGD&email=" + localStorage.getItem("email");
    label_pesos.innerHTML = '<svg aria-hidden="true" data-icon="spinner" role="img" viewBox="0 0 512 512" class="svg-spinner"><path fill="currentColor" d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"></path></svg>'
    return fetch1("https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php", {
            method: 'POST',
            headers: {
                "Content-type": "application/x-www-form-urlencoded",
            },
            body: data
        })
        .then(function(response) {
            if (response.ok) {
                return response.text()
            } else {
                throw new Error("No fue posible actualizar el saldo. Revise su conexión a internet")
            }
        })
        .then(function(texto) {
            var aux = texto.split("#");
            if (aux[0].includes("OK")) {
                localStorage.setItem("pesos", aux[1]);
                localStorage.setItem("tag_nro", aux[4]);
                localStorage.setItem("tag_lock", aux[3]);
                label_pesos.innerHTML = "$ " + aux[1];
                return true
            } else {
                throw new Error("Respuesta del servidor inválida.No fue posible obtener saldo actualizado")
            }
        })
}

function consulta_suscripcion() {
    return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/set_suscripcion/" + localStorage.getItem("email"), {
            method: 'GET'
        })
        .then(function(response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("No fue posible actualizar su estado de suscripción. Revise su conexión a internet")
            }
        })
        .then(function(texto) {
            var suscrip = texto
            if (suscrip.items[0].tipo_suscripcion !== "1") {
                localStorage.setItem("suscripto", "true");
                return true
            } else {
                localStorage.setItem("suscripto", "false");
                $("#banner1").show()
                return true
            }
        })
}

function actualiza_precio_suscripcion() {
    Promise.all([
            consulta_saldo(),
            consulta_suscripcion(),
            getLavaderos()
        ])
        .then(([resultado1, resultado2]) => {
            if (resultado1 && resultado2) {
                Swal.close()
            }
        })
        .catch(() => {
            label_pesos.innerHTML = "$ " + localStorage.getItem('pesos');
            Swal.fire({
                icon: 'error',
                title: 'Ups!',
                text: 'No podemos conectar con nuestros servidores. Revisa tu conexión e intentá nuevamente.',
                showConfirmButton: true,
                allowOutsideClick: false
            })
        })
}

function getLavaderos() {
    fetch('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/list_lavaderos/')
        .then(res => res.json())
        .then((out) => {
            listLavaderos = out.items.filter(l => l.direccion != 'OCULTO')
        })
}

function lavaderoCercano(position, lavaderos = []) {
    var distancias = []
    lavaderos.forEach((l, i) => {
        distancias[i] = Math.abs(modulo((position.lat - l.latitud), (position.lon - l.longitud)))
    })
    return lavaderos[distancias.findIndex((item) => item == Math.min.apply(null, distancias))];
}

function distanciaLavadero(posActual, posLavadero) {
    const R = 6371 //Radio de la Tierra en Km
    const deltaLat = degToRad(posLavadero.lat - posActual.lat)
    const deltaLon = degToRad(posLavadero.lon - posActual.lon)

    var a = Math.pow(Math.sin(deltaLat / 2), 2)
    var b = (Math.cos(degToRad(posActual.lat)) * Math.cos(degToRad(posLavadero.lat)) * Math.pow((deltaLon / 2), 2))
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - (a + b)))
    var res = R * c
    return res >= 1 ? (Number(res.toFixed(1)) * 1) + 'Km' : (Number(res.toFixed(3)) * 1000) + "m"
}

function degToRad(degree) {
    return degree * (Math.PI / 180);
}

function prepareCam() {
    QRScanner.getStatus((status) => {
        if ((!status.authorized) && status.denied && status.canOpenSettings) {
            if (confirm("Los permisos de cámara son necesarios para el correcto funcionamiento. Abrir ajustes?")) {
                QRScanner.openSettings()
            }
        } else if (!status.authorized) {
            console.debug('Asking camera permissions...')
            QRScanner.prepare((err, status) => {
                if (err) {
                    console.error(err)
                } else {
                    console.info('QR Scanner initialized. Status' + status)
                }
            })
        }
    })
}

window.onload = function() {
    uname = localStorage.getItem("name");
    precio_credito = localStorage.getItem("valor_cred");
    if (uname != null) {
        document.getElementById("nombre_usr").innerHTML = "Hola, <strong>" + uname + "</strong>";
    }
    label_puntos.innerHTML = localStorage.getItem("puntos");
    email = localStorage.getItem("email");
    actualiza_precio_suscripcion();
    $("body").fadeIn(200);
}

document.addEventListener("deviceready", () => {
    prepareCam();
}, false)

// document.addEventListener("DOMContentLoaded", () => {
// }, false)

document.addEventListener("backbutton", function() { navigator.app.exitApp() }, true);

window.onbeforeunload = () => {
    navigator.geolocation.clearWatch(watchID)
}
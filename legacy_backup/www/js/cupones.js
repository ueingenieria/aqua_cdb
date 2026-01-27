var bot_active = document.getElementById("boton_activos");
var bot_used = document.getElementById("boton_usados");
var div_cupones = document.getElementById("div_cupones");
var div_cupones2 = document.getElementById("div_cupones_usados");
var label_pesos = document.getElementById("label_pesos");
var label_puntos = document.getElementById("label_puntos");
var bot_cod_cupon = document.getElementById("codigo_cupon")
var usr_id, cont_img, cont_target
var str_cupones = new Array()
var email
var enable_cordovaFetch
var lavaderos = []

function fetch1(url, opt) {
    if (enable_cordovaFetch == undefined)
        return fetch(url, opt);
    else
        return cordovaFetch(url, opt);
}

window.onload = function() {
    label_pesos.innerHTML = "$ " + localStorage.getItem("pesos");
    label_puntos.innerHTML = localStorage.getItem("puntos");
    email = localStorage.getItem("email");
    div_cupones2.style.display = "none";
    div_cupones.style.display = "flex";
    $("body").fadeIn(200);


    if (enable_cordovaFetch == undefined)
        update_cupones();
    else
        document.addEventListener("deviceready", update_cupones, false);
}

function abrir_url(url) {
    var target = "_blank";
    var options = "location=no,hidden=yes,hardwareback=no";
    mercadopago = cordova.InAppBrowser.open(url, target, options);
    mercadopago.addEventListener("loadstop", mostrar_web);
}

function mostrar_web() {
    Swal.close();
    mercadopago.show();
}

bot_used.onclick = function() {
    div_cupones.style.display = "none";
    $("#div_cupones_usados").fadeIn(300);
    bot_used.classList.remove(['inactive'])
    bot_active.classList.add(['inactive'])
}

bot_active.onclick = function() {
    div_cupones2.style.display = "none";
    $("#div_cupones").fadeIn(300);
    bot_active.classList.remove(['inactive'])
    bot_used.classList.add(['inactive'])
}

function consulta_lavaderos() {
    return fetch('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/list_lavaderos/')
        .then(res => res.json())
        .then((out) => {
            lavaderos = out.items.filter(l => l.direccion != 'OCULTO');
        })
}

function lavaderoCercano(position, lavaderos = []) {
    var distancias = []
    lavaderos.forEach((l, i) => {
        distancias[i] = Math.abs(modulo((position.lat - l.latitud), (position.lon - l.longitud)))
    })
    return lavaderos[distancias.findIndex((item) => item == Math.min.apply(null, distancias))];
}

function modulo(i, j) {
    return ((i ** 2) + (j ** 2));
}

function click_cupon(value) {
    if (str_cupones[value].tipo_cupon == "SUS" || (str_cupones[value].tipo_cupon == "CAN" && str_cupones[value].grupo_id == "4D")) {
        var tipo_lavado = str_cupones[value].observaciones.split("#");

        //if(tipo_lavado.length >= 2) //Verifica que este completa la informacion

        Swal.fire({
            title: 'Canje de cupón',
            icon: "info",
            html: 'Cupón válido solo en lavaderos AquaExpress 4D<br>Tipo de lavado: <b>' + tipo_lavado[0] + '</b>',
            confirmButtonText: 'Canjear!',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                //Convertir a promesa
                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition((position) => {
                            var lavCercano = lavaderoCercano({
                                lat: position.coords.latitude,
                                lon: position.coords.longitude,
                                acc: position.coords.accuracy,
                                alt: position.coords.altitude,
                                timestamp: position.timestamp
                            }, lavaderos.filter(l => l.tipo_lavadero == "4D"))
                            const today = new Date()
                            const times = SunCalc.getTimes(today, position.coords.latitude, position.coords.longitude, position.coords.altitude)
                            setTimeout(() => {
                                resolve(true)
                                location.replace(`qr.html?V1=${lavCercano.tipo_totem=='V1'}&TORCH=${today.getTime() > times.sunset.getTime() || today.getTime() < times.sunriseEnd.getTime()}&IDPROMO=${str_cupones[value].cuponnumber}&LAVADO=${tipo_lavado[1]}`);
                            }, 1000)
                        },
                        (err) => {
                            console.error(err)
                            resolve(true)
                            location.replace(`qr.html?V1=false&TORCH=false&IDPROMO=${str_cupones[value].cuponnumber}&LAVADO=${tipo_lavado[1]}`);
                        }, { maximumAge: 3000, timeout: 10000, enableHighAccuracy: true })
                })
            }
        })
    } else {
        Swal.fire({
            title: 'Cupón: ' + str_cupones[value].nota,
            icon: "info",
            html: `<h1 style="margin:0px;"><a id="titulo_lav">${str_cupones[value].valido_en}</a></h1><br>Usá el siguiente código para canjear este cupón:<br><b><h2>${str_cupones[value].codigo_de_cambio}</h2></b>`,
            confirmButtonText: 'Listo!',
            onBeforeOpen: () => {
                if (str_cupones[value].valido_en != "") {
                    document.getElementById("titulo_lav").setAttribute("onclick", `cordova.InAppBrowser.open('https://www.aquaexpress.com.ar/aqua4d/aqua_maps2.html?zoom=17&id_lav=${lavaderos[str_cupones[value].id_lavadero].external_id}&platform=${window.cordova.platformId}','_blank','location=no,hardwareback=no,closebuttoncaption=Volver,hidenavigationbuttons=yes,hidespinner=yes,disallowoverscroll=yes,lefttoright=yes')`)
                }
            }
        });
    }
}

function mostrar_cupones(cupones) {
    var i
    var img_temp
    cont_target = 0;
    cont_img = 0;
    var cont_cupones = 0;
    var cont_cupones_usados = 0;
    var descripcion;

    var n1 = 0,
        n2 = 0
    for (i = 0; i < (cupones.items.length); i++) {
        str_cupones[i] = cupones.items[i];

        if (cupones.items[i].tipo_cupon == "SUS") {
            descripcion = cupones.items[i].observaciones.split("#")[0] + " Gratis!";
        } else {
            descripcion = cupones.items[i].nota;
        }

        if (cupones.items[i].usado == "NO") {
            cont_cupones++;
            div_temp = document.createElement("div");
            div_temp.setAttribute("onclick", "click_cupon(" + i + ")");
            div_temp.setAttribute("class", "cupon1 animate_flying_in");
            div_temp.setAttribute("style", "animation-delay:0." + (2 + n1++) + "s")
            if (cupones.items[i].titulo_cupon.includes("Beneficio")) {
                div_temp.classList.add('cupon_benef');
            }
            // img_temp = document.createElement("img");
            // img_temp.setAttribute("src", "img/cupon_mini2.png");
            spacer = document.createElement("div");
            spacer.style.width = "3em";
            spacer.style.display = "flex";
            div_text_temp = document.createElement("div");
            div_text_temp.setAttribute("id", "cupon_content");
            title_temp = document.createElement("h2");
            title_temp.innerHTML = cupones.items[i].titulo_cupon;
            label1_temp = document.createElement("label");
            label1_temp.setAttribute("id", "descripcion")
            label1_temp.innerHTML = descripcion;
            labelvalido_temp = document.createElement("label");
            labelvalido_temp.innerHTML = cupones.items[i].valido_en;
            label2_temp = document.createElement("label");
            label2_temp.setAttribute("id", "vencimiento")
            label2_temp.innerHTML = "Válido hasta <strong>" + cupones.items[i].fecha_expiracion + "</strong>";

            div_cupones.appendChild(div_temp);
            // div_temp.appendChild(img_temp);
            div_temp.appendChild(spacer)
            div_temp.appendChild(div_text_temp);
            div_text_temp.appendChild(label2_temp);
            div_text_temp.appendChild(title_temp);
            div_text_temp.appendChild(label1_temp);
            div_text_temp.appendChild(labelvalido_temp);

        } else if (cupones.items[i].usado == "SI") {
            cont_cupones_usados++;
            div_temp = document.createElement("div");
            div_temp.setAttribute("class", "cupon1 usado animate_flying_in");
            div_temp.setAttribute("style", "animation-delay:0." + (2 + n2++) + "s")
                // img_temp = document.createElement("img");
                // img_temp.setAttribute("src", "img/cupon_mini_bw.png");
                // spacer = document.createElement("div");
                // spacer.style.width = "3em";
                // spacer.style.display = "flex";
            div_text_temp = document.createElement("div");
            div_text_temp.setAttribute("id", "cupon_content");
            title_temp = document.createElement("h2");
            title_temp.innerHTML = cupones.items[i].titulo_cupon;
            label1_temp = document.createElement("label");
            label1_temp.setAttribute("id", "descripcion");
            label1_temp.innerHTML = cupones.items[i].nota;
            labelvalido_temp = document.createElement("label");
            labelvalido_temp.innerHTML = cupones.items[i].valido_en;
            label2_temp = document.createElement("label");
            label2_temp.setAttribute('id', 'vencimiento');
            label2_temp.innerHTML = "Usado el <strong>" + cupones.items[i].fecha_uso + "</strong>";

            div_cupones2.appendChild(div_temp);
            // div_temp.appendChild(img_temp);
            // div_temp.appendChild(spacer);
            div_temp.appendChild(div_text_temp);
            div_text_temp.appendChild(label2_temp);
            div_text_temp.appendChild(title_temp);
            div_text_temp.appendChild(label1_temp);
            div_text_temp.appendChild(labelvalido_temp);

        }
    }

    if (cont_cupones == 0) {
        title_temp = document.createElement("p");
        title_temp.innerHTML = "No tenés cupones disponibles";
        title_temp.setAttribute("class", "no_cupon");
        div_cupones.appendChild(title_temp);
    }

    if (cont_cupones_usados == 0) {
        title_temp = document.createElement("p");
        title_temp.innerHTML = "No registrás cupones usados en los últimos 30 días";
        title_temp.setAttribute("class", "no_cupon");
        div_cupones2.appendChild(title_temp);
    }
}

function imagen_cargada() {
    cont_img++;
    if (cont_img == cont_target) {
        Swal.close();
    }
}

function update_cupones() {
    Swal.fire({
        text: 'Actualizando cupones...',
        allowOutsideClick: false,
        onBeforeOpen: () => {
            Swal.showLoading()
        }
    })
    return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/cupones/", {
            method: 'GET',
            headers: {
                "Content-type": "application/x-www-form-urlencoded",
                "p_login": email
                    //"p_usado": "NO"
            }
        })
        .then(function(response) {
            if (response.ok) {
                return response.text();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Ups!",
                    text: 'Tenemos problemas técnicos. Intentá de nuevo',
                    allowOutsideClick: false,
                    onClose: () => {
                        location.replace("loged.html");
                    }
                })
            }
        })
        .then(function(texto) {
            var cupones = JSON.parse(texto);
            consulta_lavaderos().then(() => {
                    cupones.items.forEach((item) => {
                        if (item.valido_en != "" && item.valido_en != undefined) {
                            item.id_lavadero = lavaderos.findIndex((it) => { return it.external_id == item.valido_en })
                            item.valido_en = lavaderos[item.id_lavadero].nombre
                        } else {
                            item.valido_en = ""
                        }
                    })
                    mostrar_cupones(cupones);
                    // consulta_suscripcion();
                })
                .finally(() => {
                    Swal.close()
                })
        })
        .catch(function(err) {
            Swal.fire({
                icon: "error",
                title: "Ups!",
                text: "Hay problemas con la conexión. Intentá de nuevo",
                allowOutsideClick: false,
                onClose: () => {
                    location.replace("loged.html");
                }
            })

        })

}

bot_cod_cupon.onclick = function() {
    Swal.fire({
            title: 'Ingresá tu código de cupón',
            input: 'text',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debes ingresar un código'
                }
                if (value.length < 4) {
                    return 'El codigo ingresado no es válido'
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Validar',
            reverseButtons: true,
            showLoaderOnConfirm: true,
            preConfirm: (codigo) => {
                codigo = codigo.toUpperCase()
                var usado = str_cupones.find(item => {
                    var code = item.nota.split('(')[1]
                    if (!code) return false
                    code = code.split(')')[0]
                    return code == codigo
                })
                if (!!usado) {
                    Swal.showValidationMessage('El cupón ya ha sido utilizado')
                    return false
                }
                return fetch1('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/productos_ocultos/', {
                        method: 'GET',
                        headers: {
                            "Content-type": "application/x-www-form-urlencoded",
                        }
                    })
                    .then(response => {
                        return response.json()
                    })
                    .then(cupones => {
                        var cupon = cupones.items.find(item => {
                            var code = item.nota.split('(')[1]
                            if (!code) return false
                            code = code.split(')')[0]
                            return code == codigo
                        })
                        return !cupon ? null : cupon;
                    })
            }
        })
        .then((result) => {
            if (!result.dismiss) {
                if (!result.value) {
                    Swal.fire('Ups!', 'No pudimos encontrar el cupón. Revisa el código e intenta nuevamente', 'error')
                    return
                }
                Swal.fire({
                        title: 'Detalles de Cupón',
                        html: `<h2>${result.value.descripcion}</h2></br>` +
                            // `<img style="width:20%;" src="data:image/png;base64,${result.value.image.replace(/\r\n/g,String.fromCharCode(13,10))}">`+
                            `<label>${result.value.nota}</label>`,
                        showLoaderOnConfirm: true,
                        confirmButtonText: 'Canjear!',
                        showCancelButton: true,
                        reverseButtons: true,
                        preConfirm: () => {
                            return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/puntos/", {
                                    method: 'PUT',
                                    headers: {
                                        "Content-Type": "text/plain",
                                        "p_login": email,
                                        "p_producto": result.value.id_producto
                                    }
                                })
                                .then(function(response) {
                                    if (response.ok) {
                                        return response.text()
                                    } else {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Ups!',
                                            text: "Estamos teniendo problemas técnicos. Intentá de nuevo (001)"
                                        })
                                    }
                                })
                        }
                    })
                    .then(function(text) {
                        if (!!text.dismiss) return
                        console.log(text)
                        if (text.value.includes("Puntos canejados correctamente")) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Listo!',
                                text: "Podes encontrar el cupón en -Mis Cupones-"
                            })
                            window.location.reload();
                        } else if (text.value.includes("No tiene puntos suficientes")) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Ups!',
                                text: "Hubo un error. Intentá nuevamente"
                            })
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Ups!',
                                text: "Estamos teniendo problemas técnicos. Intentá de nuevo (002)"
                            })
                        }
                    })
                    .catch(function(err) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Ups!',
                            text: "Estamos teniendo problemas técnicos. Intenta de nuevo (003)" + err
                        })
                    })
            }
        })
}

$("#atras").click(function() {
    location.replace("loged.html");
})

document.addEventListener("backbutton", function() { location.replace("loged.html") }, true);
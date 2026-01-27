var email
var cont_promos
var str_promos = new Array()
var enable_cordovaFetch
    // var bot_notif = document.getElementById("notificaciones");

function fetch1(url, opt) {
    if (enable_cordovaFetch == undefined)
        return fetch(url, opt);
    else
        return cordovaFetch(url, opt);
}

// bot_notif.onclick = function() {

//     Swal.fire({
//         toast: true,
//         position: 'top-end',
//         showConfirmButton: false,
//         timer: 750,
//         timerProgressBar: false,
//         title: 'No tenés notificaciones',
//         background: "#eff2f9"
//     })

// }

window.onload = function() {
    document.getElementById("label_pesos").innerHTML = "$ " + localStorage.getItem("pesos");
    email = localStorage.getItem("email");
    pass = localStorage.getItem("pass");
    div_promos = document.getElementById("div_promos");
    label_puntos = document.getElementById("label_puntos")
    label_puntos.innerHTML = localStorage.getItem("puntos");
    $("body").fadeIn(200);

    if (enable_cordovaFetch == undefined)
        buscar_promos();
    else
        document.addEventListener("deviceready", buscar_promos, false);

}

function actualiza_puntos() {

    label_puntos.innerHTML = "--";
    return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/login/", {
            method: 'POST',
            headers: {
                "Content-type": "application/x-www-form-urlencoded",
                "Connection": "close",
                "p_login": email,
                "p_password": pass
            },
            body: ""
        })
        .then(function(response) {
            if (response.ok) {
                return response.text()
            }
        })
        .then(function(text) {
            var aux = JSON.parse(text);
            if (aux.p_msg.includes("Acceso correcto")) {
                localStorage.setItem("puntos", aux.p_puntos);
                label_puntos.innerHTML = aux.p_puntos;
            }

        })
        .catch(() => {

        })

}

function buscar_promos() {
    Swal.fire({
        text: 'Buscando promociones disponibles...',
        allowOutsideClick: false,
        onBeforeOpen: () => {
            Swal.showLoading()
        }
    })
    return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/productos/", {
            method: 'GET',
            headers: {
                "Content-type": "application/x-www-form-urlencoded",
            }
        })
        .then(function(response) {
            if (response.ok) {
                return response.text()
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
            mostrar_promos(JSON.parse(texto).items);
        })
        .catch(function(err) {
            Swal.fire({
                icon: "error",
                title: "Ups!",
                text: 'Tenemos problemas técnicos. Intentá de nuevo',
                allowOutsideClick: false,
                onClose: () => {
                    location.replace("loged.html");
                }
            })
        })
}

function imagen_cargada() {
    cont_img++;
    if (cont_img == cont_target) {
        Swal.close();
    }
}

function mostrar_promos(list_promos) {
    list_promos.sort(function(a, b) { return a.puntos_necesarios - b.puntos_necesarios })
    for (i = 0; i < (list_promos.length); i++) {

        str_promos[i] = list_promos[i];
        if (list_promos[i].puntos_necesarios <= localStorage.getItem("puntos")) {
            div_temp = document.createElement("div");
            if (localStorage.getItem("suscripto") === "true" && list_promos[i].exclusivo === "SI") {
                div_temp.setAttribute("onclick", "click_promo(" + i + ")");
            } else if (list_promos[i].exclusivo === "NO") {
                div_temp.setAttribute("onclick", "click_promo(" + i + ")");
            } else {
                div_temp.setAttribute("onclick", "no_suscripto()");
            }
            div_temp.setAttribute("class", "cupon_promo");
            img_temp = document.createElement("img");
            img_temp.src = "data:image/png;base64," + list_promos[i].image.replace(/\r\n/g, String.fromCharCode(13, 10));
            div_text_temp = document.createElement("div");
            span_temp = document.createElement("span");
            if (list_promos[i].exclusivo === "NO") {
                title_temp = document.createElement("h3");
                title_temp.innerHTML = list_promos[i].descripcion;
                span_temp.appendChild(title_temp);
            } else {
                title_temp = document.createElement("h3");
                title_temp.innerHTML = list_promos[i].descripcion;
                span_temp.appendChild(title_temp);
                img_club_temp = document.createElement("img");
                img_club_temp.src = "img/Icono_exclusivo.svg";
                img_club_temp.setAttribute("class", "img_exclusivo")
                div_temp.appendChild(img_club_temp)
            }

            label1_temp = document.createElement("label");
            label1_temp.innerHTML = list_promos[i].nota;
            label2_temp = document.createElement("label");
            label2_temp.setAttribute("id", "text_puntos");
            label2_temp.innerHTML = list_promos[i].puntos_necesarios + " puntos";

            div_promos.appendChild(div_temp);
            div_temp.appendChild(img_temp);
            div_temp.appendChild(div_text_temp);
            div_text_temp.appendChild(span_temp);
            div_text_temp.appendChild(label1_temp);
            div_text_temp.appendChild(label2_temp);
        } else {
            div_temp = document.createElement("div");
            div_temp.setAttribute("class", "cupon_promo_gris");
            img_temp = document.createElement("img");
            img_temp.src = "data:image/png;base64," + list_promos[i].image.replace(/\r\n/g, String.fromCharCode(13, 10));
            div_text_temp = document.createElement("div");
            span_temp = document.createElement("span");
            if (list_promos[i].exclusivo === "NO") {
                title_temp = document.createElement("h3");
                title_temp.innerHTML = list_promos[i].descripcion;
                span_temp.appendChild(title_temp);
            } else {
                title_temp = document.createElement("h3");
                title_temp.innerHTML = list_promos[i].descripcion;
                span_temp.appendChild(title_temp);
                img_club_temp = document.createElement("img");
                img_club_temp.src = "img/Icono_exclusivo.svg";
                img_club_temp.setAttribute("class", "img_exclusivo")
                div_temp.appendChild(img_club_temp)
            }

            label1_temp = document.createElement("label");
            label1_temp.innerHTML = list_promos[i].nota;
            label2_temp = document.createElement("label");
            label2_temp.setAttribute("id", "text_puntos_gris");
            label2_temp.innerHTML = list_promos[i].puntos_necesarios + " puntos";

            div_promos.appendChild(div_temp);
            div_temp.appendChild(img_temp);
            div_temp.appendChild(div_text_temp);
            div_text_temp.appendChild(span_temp);
            div_text_temp.appendChild(label1_temp);
            div_text_temp.appendChild(label2_temp);
        }
    }

    Swal.close();
}

function click_promo(value) {

    Swal.fire({
        title: 'Canje de puntos',
        icon: "question",
        html: "Vas a canjear <b>" + str_promos[value].puntos_necesarios + " pts</b> por <b>" + str_promos[value].descripcion + "</b>. <br>Estás seguro?",
        showLoaderOnConfirm: true,
        confirmButtonText: 'Canjear!',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/puntos/", {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "text/plain",
                        "p_login": email,
                        "p_producto": str_promos[value].id_producto
                    },
                    body: ""
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
                .then(function(text) {
                    if (text.includes("Puntos canejados correctamente")) {
                        actualiza_puntos();
                        Swal.fire({
                            icon: 'success',
                            title: 'Listo!',
                            text: "Ya canjeamos tus puntos. Podés verlo en la sección -Mis Cupones-"
                        })
                    } else if (text.includes("No tiene puntos suficientes")) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Ups!',
                            text: "No tenés puntos suficientes para canjear este producto.\nRecordá que todas tus compras y lavados suman puntos!"
                        })
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Ups!',
                            text: "Estamos teniendo problemas técnicos. Intenta de nuevo (002)"
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

function no_suscripto() {
    window.open = cordova.InAppBrowser.open;
    Swal.fire({
        html: '<h3>Exclusivo para miembros del Club de Beneficios</h3>' +
            '<img src="img/suscribite2.png" style="width:100%">',
        confirmButtonText: "Asociate ya",
        showCloseButton: true,
        showLoaderOnConfirm: true,
        footer: `<a href='https://www.aquaexpress.com.ar/terminos_y_condiciones/' onclick="window.open('https://www.aquaexpress.com.ar/terminos_y_condiciones/', '_system'); return false;">Terminos y condiciones</href>`,
        preConfirm: () => {
            const data = "email=" + localStorage.getItem('email')
            return fetch1("https://www.aquaexpress.com.ar/aqua4d/Aqua_pagos/suscripcion.php", {
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
                        throw new Error('Hay problemas con la conexión. Intentá de nuevo (001)');
                    }
                })
                .then(function(texto) {
                    if (!texto.includes("http")) {
                        throw new Error("No pudimos procesar la solicitud. Intentá mas tarde")
                    } else {
                        Swal.fire({
                            text: "Procesando tu solicitud...",
                            allowOutsideClick: false,
                            width: "50%",
                            onBeforeOpen: () => {
                                Swal.showLoading()
                            }
                        })
                        try {
                            abrir_url(texto);
                        } catch {
                            throw new Error("Ocurrio un error al cargar el complemento")
                        }
                    }
                })
                .catch(function(err) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Ups!',
                        text: err,
                    })
                })
        }
    })

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

$("#atras").click(function() {
    location.replace("loged.html")
})

document.addEventListener("backbutton", function() { location.replace("loged.html") }, true);
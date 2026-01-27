var close = document.getElementById("bot_close");
var lock = document.getElementById("bot_lock");
var edit = document.getElementById("edit_datos");
var add_tag = document.getElementById("add_tag");
var save = document.getElementById("save_datos");
var cancel = document.getElementById("cancel_datos");
var bot_min = document.getElementById("botonera_min");
var usr_name = document.getElementById("data_name");
var usr_surname = document.getElementById("data_surname");
var label_pesos = document.getElementById("label_pesos");
var label_puntos = document.getElementById("label_puntos");
var usr_mail = document.getElementById("data_mail");
var usr_dni = document.getElementById("data_dni");
var usr_tag = document.getElementById("data_tag");
var delete_account = document.getElementById("elimina");
// var bot_notif = document.getElementById("notificaciones");
var flag_lock;
var email, pass;
var title_msg, text_msg, text_bot
var bloquear
var enable_cordovaFetch

function fetch1(url, opt) {
    if (enable_cordovaFetch == undefined)
        return fetch(url, opt);
    else
        return cordovaFetch(url, opt);
}

// bot_notif.onclick = function(){

//   Swal.fire({
//     toast: true,
//     position: 'top-end',
//     showConfirmButton: false,
//     timer: 750,
//     timerProgressBar: false,
//     title: 'No tenés notificaciones',
//     background: "#eff2f9"
//   })
// }

close.onclick = function() {
    Swal.queue([{
        icon: "question",
        text: "Seguro que queres cerrar tu sesión?",
        confirmButtonText: 'Aceptar',
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        showLoaderOnConfirm: true,
        preConfirm: () => {
            localStorage.clear();
            location.replace("welcome.html");
        }
    }])
}

lock.onclick = function() {

    if (flag_lock == "0") {
        title_msg = "Bloquear tarjeta";
        text_msg = "Si bloqueás tu tarjeta no podrá ser usada hasta que la habilites.<br>Estás seguro?";
        bloquear = "1";
    } else {
        title_msg = "Desbloquear tarjeta";
        text_msg = "Vas a desbloquear tu tarjeta. Podrás volver a utilziarla.<br>Estás seguro?";
        bloquear = "0";
    }

    Swal.fire({
        icon: "info",
        title: title_msg,
        confirmButtonText: 'Aceptar',
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        html: text_msg,
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const data = "accion=57&email=" + usr_mail.value + "&bloqueo=" + bloquear;
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
                        Swal.fire({
                            icon: 'error',
                            title: 'Ups!',
                            text: "Algo anduvo mal. Intenta de nuevo (001)"
                        })
                    }
                })
                .then(function(text) {
                    console.log(text)
                    if (text.includes("OK_BLOQ")) {
                        lock.innerHTML = "Desbloquear Tarjeta";
                        flag_lock = "1";
                        Swal.fire({
                            icon: 'success',
                            title: 'Listo!',
                            text: "Ya bloqueamos tu tarjeta. Nadie podrá usarla."
                        })
                    } else if (text.includes("OK_DESB")) {
                        lock.innerHTML = "Bloquear Tarjeta";
                        flag_lock = "0";
                        Swal.fire({
                            icon: 'success',
                            title: 'Listo!',
                            text: "Ya habilitamos tu tarjeta. Podés volver a usarla en cualquier lavadero Aqua 4D"
                        })
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Ups!',
                            text: "Algo anduvo mal. Intenta de nuevo (002)"
                        })
                    }
                })
                .catch(() => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Ups!',
                        text: "Algo anduvo mal. Intenta de nuevo (003)"
                    })
                })
        }
    })

}

edit.onclick = function() {

    Swal.queue([{
        icon: "info",
        html: "Antes de modificar tus datos recordá que no podrás cambiar tu e-mail.",
        confirmButtonText: 'Modificar',
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        preConfirm: () => {

            usr_name.removeAttribute("disabled", "")
            usr_surname.removeAttribute("disabled", "")
            usr_dni.removeAttribute("disabled", "")

            usr_name.style.cssText = "border-bottom: 2px solid #e00000; text-transform:uppercase;"
            usr_surname.style.cssText = "border-bottom: 2px solid #e00000; text-transform:uppercase;"
            usr_dni.style.cssText = "border-bottom: 2px solid #e00000;"
            usr_mail.style.cssText = "color: #707070;"
            usr_tag.style.cssText = "color: #707070; text-transform:uppercase;"

            bot_min.removeAttribute("hidden", "")
            edit.setAttribute("hidden", "")


        }
    }])


}

save.onclick = function() {

    Swal.fire({
        text: "Guardando...",
        allowOutsideClick: false,
        onBeforeOpen: () => {
            Swal.showLoading()
        }
    })

    return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/modify_user/", {
            method: 'PUT',
            headers: {
                "p_nombre": usr_name.value,
                "p_apellido": usr_surname.value,
                "p_dni": usr_dni.value,
                "p_login": localStorage.getItem("email"),
                "Content-type": "text/html"
            },
            body: ""
        })
        .then(function(response) {
            if (response.ok) {
                return response.text()
            } else {
                Swal.fire("Ups!", "Hay un problema con la conexión. Intentá de nuevo", "warning")
            }
        })
        .then(function(texto) {
            if (texto.includes("Datos actualizados correctamente")) {
                usr_name.setAttribute("disabled", "")
                usr_surname.setAttribute("disabled", "")
                usr_dni.setAttribute("disabled", "")

                localStorage.setItem("dni", usr_dni.value);
                localStorage.setItem("name", usr_name.value);
                localStorage.setItem("surname", usr_surname.value);

                usr_name.style.cssText = "border-bottom: 1px solid #0f0f0f; text-transform:uppercase;"
                usr_surname.style.cssText = "border-bottom: 1px solid #0f0f0f; text-transform:uppercase;"
                usr_dni.style.cssText = "border-bottom: 1px solid #0f0f0f;"

                bot_min.setAttribute("hidden", "")
                edit.removeAttribute("hidden", "")
                Swal.close();
            } else {
                Swal.fire("Ups!", "Tenemos problemas técnicos. Intentá de nuevo (001)", "error")
            }

        })
        .catch(function(err) {
            Swal.fire("Ups!", "Tenemos problemas técnicos. Intentá de nuevo (002)", "error")
        })
}

cancel.onclick = function() {

    usr_dni.value = localStorage.getItem("dni");
    usr_name.value = localStorage.getItem("name");
    usr_surname.value = localStorage.getItem("surname");

    usr_name.setAttribute("disabled", "")
    usr_surname.setAttribute("disabled", "")
    usr_dni.setAttribute("disabled", "")


    usr_name.style.cssText = "border-bottom: 1px solid #0f0f0f; text-transform:uppercase;"
    usr_surname.style.cssText = "border-bottom: 1px solid #0f0f0f; text-transform:uppercase;"
    usr_dni.style.cssText = "border-bottom: 1px solid #0f0f0f;"

    bot_min.setAttribute("hidden", "")
    edit.removeAttribute("hidden", "")

}

add_tag.onclick = function() {

    var aux_text = ""

    if (usr_tag.value !== "-") {
        aux_text = "***** IMPORTANTE *****<br>Si vinculás una nueva tarjeta, la actual quedará inactiva para usar en lavaderos 4D"
    }

    Swal.fire({
        title: "Agregá tu tarjeta",
        text: "Ingresá el ID de tu tarjeta para vincularla a tu cuenta",
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        showCancelButton: true,
        footer: aux_text,
        input: "text",
        inputAttributes: {
            autocapitalize: 'off',
            maxlength: 8,
            autocorrect: 'off',
            required: true,
            id: "input_tagid",
            // autofocus: false
        },
        onRender: () => {
            document.getElementById("input_tagid").blur();
        },
        showLoaderOnConfirm: true,
        inputValidator: (value) => {
            return new Promise((resolve) => {
                if (value.length == 8) {
                    resolve()
                } else {
                    resolve('ID incorrecto')
                }
            })
        },
        preConfirm: (tarj_id) => {
            const data = "accion=59&mail=" + usr_mail.value + "&id_tarj=" + tarj_id
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
                        Swal.fire("Ups!", "Hay un problema con la conexión. Intentá de nuevo", "warning")
                    }
                })
                .then(function(texto) {
                    if (texto.includes("OK")) {
                        usr_tag.value = texto.split("#")[2];
                        localStorage.setItem("tag_nro", usr_tag.value);
                        saldo_ant = parseInt(localStorage.getItem("pesos"));
                        saldo_tag = parseInt(texto.split("#")[1]);
                        saldo_suma = saldo_ant + saldo_tag;
                        localStorage.setItem("pesos", saldo_suma);
                        label_pesos.innerHTML = "$ " + localStorage.getItem("pesos");
                        Swal.fire({
                            icon: "success",
                            title: "Tarjeta vinculada!",
                            html: "Se vinculo correctamente la tarjeta a tu cuenta<br>" +
                                "<br>" +
                                "<div id='div_suma'>" +
                                "<div id='suma_saldo'><label class='text_suma'>Saldo anterior:</label>$" + saldo_ant + "</div>" +
                                "<div id='suma_saldo'><label class='text_suma'>Saldo en tarjeta:</label>$" + saldo_tag + "+</div>" +
                                "<div id='suma_saldo'><label class='text_suma'>Saldo actual:</label>$" + saldo_suma + "</div>" +
                                "</div>"
                        })
                    } else {
                        Swal.fire("Ups!", "El ID de tarjeta ingresado es inválido o ya está registrado", "warning")
                    }

                })
                .catch(function(err) {
                    Swal.fire("Ups!", "Tenemos problemas técnicos. Intentá de nuevo", "error")
                })
        },
    }).then((result) => {


    })

}

delete_account.onclick = function() {
    Swal.queue([{
        title: "Eliminar cuenta",
        icon: "warning",
        html: "<span>Esta acción elimina todos tus datos de nuestros sistemas de forma <strong>DEFINITIVA</strong>. ¿Estás seguro que deseas continuar?</span>",
        confirmButtonText: "Eliminar",
        confirmButtonColor: "#e74c3c",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            return Swal.insertQueueStep({
                title: "Ingresá tu contraseña para confirmar",
                input: "password",
                confirmButtonText: "Eliminar cuenta",
                confirmButtonColor: "#e74c3c",
                showCancelButton: true,
                cancelButtonText: "Cancelar",
                inputValidator: (value) => {
                    if (value != localStorage.pass) {
                        return "Contraseña incorrecta"
                    }
                    return
                },
                showLoaderOnConfirm: true,
                allowOutsideClick: () => !Swal.isLoading(),
                preConfirm: (pass) => {
                    var email = localStorage.getItem('email')
                    return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/delete_user/", {
                            method: 'POST',
                            headers: {
                                "Content-type": "application/x-www-form-urlencoded",
                                "p_login": email,
                                "p_password": pass
                            }
                        })
                        .then(res => {
                            if (res.ok) {
                                if (res.headers.get('p_code') != 0) throw { alert: false, msg: 'Hubo un problema con tu solicitud. Revisá tu usuario y contraseña e intentá nuevamente.' }
                                return res.json();
                            } else {
                                throw { alert: true, msg: 'Hubo un problema interno. Intentá nuevamente mas tarde.' }
                            }
                        })
                        .then((json) => {
                            console.log(json)
                            return fetch1("https://www.aquaexpress.com.ar/aqua4d/aqua_pagos_mp/cancelar_suscripcion.php", {
                                    method: 'POST',
                                    headers: {
                                        "Content-type": "application/json",
                                        "Api-Key": "f0eb7620-ad67-4508-bf7a-ab76e774bb1a"
                                    },
                                    body: JSON.stringify({ email })
                                })
                                .then(res => {
                                    if (res.ok) {
                                        return res.json()
                                    } else {
                                        throw { alert: true, msg: res.statusText }
                                    }
                                })
                                .then(r => {
                                    var msg = ''
                                    if (r.unsubscription_status) {
                                        msg = '<p>Tus datos han sido <strong>completamente eliminados</strong> de nuestros servidores y tu suscripción cancelada.</p><small>Cualquier duda o inconveniente podés escribirnos a <a href="mailto:administracion@aquaexpress.com.ar">administracion@aquaexpress.com.ar</a></small>'
                                    } else {
                                        msg = '<p>Tus datos han sido <strong>completamente eliminados</strong> de nuestros servidores. Si tenes alguna suscripción activa tendrás que cancelarla <strong>manualmente</strong>.</p><small>Cualquier duda o inconveniente podés escribirnos a <a href="mailto:administracion@aquaexpress.com.ar">administracion@aquaexpress.com.ar</a></small>'
                                    }
                                    return Swal.insertQueueStep({
                                        icon: "success",
                                        title: "Cuenta eliminada",
                                        html: msg,
                                        allowOutsideClick: false,
                                        confirmButtonText: 'OK',
                                        onClose: () => {
                                            localStorage.clear();
                                            location.replace("welcome.html");
                                        }
                                    })
                                })
                        })
                        .catch(err => {
                            console.log(err)
                            if (err.alert) {
                                return Swal.insertQueueStep({
                                    icon: "error",
                                    title: "Ups!",
                                    text: err.msg,
                                    allowOutsideClick: false,
                                })
                            }
                            Swal.showValidationMessage(err.msg)
                        })
                }
            })
        }

    }])
}

function consulta_suscripcion(email) {
    const subBanner = document.getElementById('texto')
    const subIcon = document.getElementById('sub_icon')
    const infoRef = document.getElementById('question')

    const suscripcion = [{
            case: 'active',
            msg: 'Suscripción activa',
            icon: '<svg class="success_icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/></svg>',
            detail: 'Por cada primer <strong>Lavado 4D</strong> o compra de hasta <strong>4 créditos</strong> autolavado que hagas en el mes, tendrás otro igual GRATIS!'
        },
        {
            case: 'paused',
            msg: 'Suscripción suspendida',
            icon: '<svg class="warning_icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32z"/></svg>',
            detail: 'Tuvimos problemas para procesar tu pago. Contactanos para poder resolverlo.'
        },
        {
            case: 'process',
            msg: 'Suscripción en proceso',
            icon: '<svg class="info_icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-144c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"/></svg>',
            detail: 'Estamos esperando la aprobación de tu tarjeta. Revisá mas tarde.'
        },
        {
            case: 'inactive',
            msg: 'No estas suscripto',
            icon: '<svg class="info_icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-144c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"/></svg>',
            detail: `Un mundo de beneficios te está esperando. Que esperás? <a href="https://www.aquaexpress.com.ar/aqua4d/aqua_pagos_mp/checkout.html?email=${email}" target="_system">Sumate AHORA!</a>`
        },
        {
            case: 'www-error',
            msg: 'Ocurrió un error',
            icon: '<svg class="error_icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zm32 224c0 17.7-14.3 32-32 32s-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32z"/></svg>',
            detail: 'Ocurrió un error al consultar el estado de tu suscripción. Intentá nuevamente mas tarde.'
        }
    ]

    return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/set_suscripcion/" + email, {
            method: 'GET',
            headers: {
                "Content-type": "application/x-www-form-urlencoded",
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
            switch (JSON.parse(texto).items[0].tipo_suscripcion) {
                case "2":
                    {
                        subBanner.innerHTML = suscripcion[0].msg
                        subIcon.innerHTML = suscripcion[0].icon
                        infoRef.onclick = function() {
                            Swal.fire({
                                icon: 'success',
                                title: suscripcion[0].msg,
                                html: suscripcion[0].detail,
                                showConfirmButton: false,
                                showCloseButton: true
                            })
                        }
                    }
                    break;
                case "3":
                    {
                        subBanner.innerHTML = suscripcion[2].msg
                        subIcon.innerHTML = suscripcion[2].icon
                        infoRef.onclick = function() {
                            Swal.fire({
                                icon: 'info',
                                title: suscripcion[2].msg,
                                html: suscripcion[2].detail,
                                showConfirmButton: false,
                                showCloseButton: true
                            })
                        }
                    }
                    break;
                case "4":
                    {
                        subBanner.innerHTML = suscripcion[1].msg
                        subIcon.innerHTML = suscripcion[1].icon
                        infoRef.onclick = function() {
                            Swal.fire({
                                icon: 'warning',
                                title: suscripcion[1].msg,
                                html: suscripcion[1].detail,
                                showConfirmButton: false,
                                showCloseButton: true
                            })
                        }
                    }
                    break;
                default:
                    {
                        subBanner.innerHTML = suscripcion[3].msg
                        subIcon.innerHTML = suscripcion[3].icon
                        infoRef.onclick = function() {
                            Swal.fire({
                                icon: 'info',
                                title: suscripcion[3].msg,
                                html: suscripcion[3].detail,
                                showConfirmButton: false,
                                showCloseButton: true
                            })
                        }
                    }
                    break;
            }
            Swal.close();
        })
        .catch(function(err) {
            subBanner.innerHTML = suscripcion[4].msg
            subIcon.innerHTML = suscripcion[4].icon
            infoRef.onclick = function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Conexión inestable',
                    html: suscripcion[4].detail,
                    showConfirmButton: false,
                    showCloseButton: true
                })
            }
        })
}

window.onload = function() {
    usr_dni.value = localStorage.getItem("dni");
    usr_name.value = localStorage.getItem("name");
    usr_surname.value = localStorage.getItem("surname");
    usr_mail.value = localStorage.getItem("email");
    usr_tag.value = localStorage.getItem("tag_nro");
    consulta_suscripcion(localStorage.getItem("email"))
    if (usr_tag.value === "") {
        usr_tag.value = "-";
        lock.style.cssText = "display: none";
    }
    flag_lock = localStorage.getItem("tag_lock");
    label_pesos.innerHTML = "$ " + localStorage.getItem("pesos");
    label_puntos.innerHTML = localStorage.getItem("puntos");

    if (flag_lock == "0") {
        lock.innerHTML = "Bloquear Tarjeta";
    } else {
        lock.innerHTML = "Desbloquear Tarjeta";
    }
    $("body").fadeIn(200);
}


$("#atras").click(function() {
    location.replace("loged.html")
})

document.addEventListener("backbutton", function() { location.replace("loged.html") }, true);
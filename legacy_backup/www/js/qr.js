var img_qr = document.getElementById("qr_pago");
var qr = document.getElementById("qr");
var etiqueta = document.getElementById("label_espera");
var qrCard = document.getElementById("qr_container");
var torch = document.getElementById("light");
var torchTimeoutID = null
var label_info = document.getElementById("label_info")
var email = "";
var enable_cordovaFetch
var qrReady = false
var qrHidden = true

const idPromo = findGetParameter('IDPROMO')
const lavadoPromo = findGetParameter('LAVADO')
const totemV1 = findGetParameter('V1') === 'true'
const torchStatus = findGetParameter('TORCH') === 'true'

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substring(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}

var mc = new Hammer.Manager(qrCard, {
    recognizers: [
        [Hammer.Pan, { direction: Hammer.DIRECTION_VERTICAL }]
    ]
})
mc.on("pan", function(ev) {
    if (ev.additionalEvent == 'panup' && qrHidden) {
        setTranslate(ev.deltaY + 'px', qrCard)
        if (Math.abs(ev.deltaY) > 50) {
            showQR(true)
        }
    } else if (ev.additionalEvent == 'pandown' && !qrHidden) {
        setTranslate(ev.deltaY + 'px', qrCard)
        if (Math.abs(ev.deltaY) > 50) {
            showQR(false)
        }
    }
})

function label_msg(status = null) {
    if (!status) {
        label_info.innerHTML = '<svg aria-hidden="true" data-icon="spinner" role="img" viewBox="0 0 512 512" style="font-size:1.8em;margin-top: 10%;" class="svg-spinner"><path fill="currentColor" d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"></path></svg>'
    } else {
        label_info.innerHTML = `<span>${status}</span>`
    }
}

function decryptQr(encryptedId) {
    const secretKey = "4qu@3xpres5"
    const simpleCrypto = new SimpleCrypto(secretKey)
    try {
        const decipherObj = simpleCrypto.decrypt(encryptedId)
        return decipherObj;
    } catch (error) {
        throw new Error('Qr inválido. Intente nuevamente.')
    }
}

function showQR(status) {
    qrHidden = !status
    if (status) {
        hideCam()
        setTranslate('-89%', qrCard)
    } else {
        showCam()
        setTranslate('0px', qrCard)
    }
}

function setTranslate(yPos, el) {
    el.style.transform = `translateY(${yPos})`;
}

function fetch1(url, opt) {
    if (enable_cordovaFetch == undefined)
        return fetch(url, opt);
    else
        return cordovaFetch(url, opt);
}

document.addEventListener("deviceready", () => {
    prepareQR();
    torchTimeoutID = setTimeout(() => {
        totemV1 ? showQR(qrHidden) : (!torchStatus || toggleTorch())
    }, 1000)
}, false)

window.onload = function() {
    email = localStorage.getItem("email");
    actualiza_qr();
    $("body").fadeIn(200);
}

function prepareQR() {
  console.debug('Prepare QR launched...')
  QRScanner.getStatus(status => {
      if (!status.authorized || status.denied) {
          location.replace(idPromo ? 'cupones.html' : 'loged.html')
      }
  })
  QRScanner.prepare((err, status) => {
      if (err) {
          console.error(err)
      } else {
          console.info('QR Scanner initialized. Status' + status)
          scanQr()
          QRScanner.show(status => { console.debug('Showing:' + status) })
      }
  })
  torch.onclick = toggleTorch
}

function scanQr() {
  QRScanner.scan(async(err, text) => {
      if (err) {
          // an error occurred, or the scan was canceled (error code `6`)
          label_msg('Ocurrió un error')
          console.error(err)
      } else {
          // The scan completed, display the contents of the QR code:
          label_msg()
          try {
              let lavaderoID = decryptQr(text)
              let qrContent = idPromo ? await qrPromo(lavaderoID) : await qrPayment(lavaderoID)
              console.log(qrContent)
              switch (qrContent.status) {
                  case 'success':
                      location.replace(`status_payment.html?titulo=Pago Exitoso&subtitulo=${qrContent.msg}&email=${qrContent.mail}&precio=${qrContent.lavado_seleccionado_precio}&seleccionado=${qrContent.lavado_seleccionado_n}&lavado=${qrContent.lavado_seleccionado_tag}&type=success`);
                      break;
                  case 'rejected':
                      location.replace(`status_payment.html?titulo=Pago Rechazado&subtitulo=${qrContent.msg}&email=${qrContent.mail}&precio=${qrContent.lavado_seleccionado_precio}&seleccionado=${qrContent.lavado_seleccionado_n}&lavado=${qrContent.lavado_seleccionado_tag}&type=error`);
                      break;
                  case 'error':
                      pageStatus('Error', qrContent.description, 'error')
                      break;
                  case 'warning':
                      pageStatus('Advertencia', qrContent.description, 'warning')
                      break;
              }

          } catch (err) {
              console.error(err)
              label_msg(err)
              setTimeout(scanQr, 1000)
          }
      }
  })
}

function pageStatus(titulo, subtitulo, tipo) {
  location.replace(`alert.html?titulo=${titulo}&subtitulo=${subtitulo}&type=${tipo}`)
}

function toggleTorch() {
  QRScanner.getStatus(s => {
      if (s.lightEnabled) {
          QRScanner.disableLight()
          torch.lastElementChild.src = "./img/lightbulb-fill.svg"
      } else {
          QRScanner.enableLight()
          torch.lastElementChild.src = "./img/lightbulb-off-fill.svg"
      }
  })
}

function showCam() {
  QRScanner.getStatus(s => {
      if (!s.showing) {
          QRScanner.show(status => { console.debug('Showing:' + status) })
      }
      if (!s.previewing) {
          QRScanner.resumePreview((status) => { console.debug('Preview resumed:' + status) })
      }
  })
}

function hideCam() {
  QRScanner.pausePreview((status) => { console.log('Preview Paused:' + status) })
  QRScanner.hide((status) => { console.log('Cam Hide:' + status) })
}

async function qrPayment(idLavadero) {
  let data = {
      mail: email,
      id_lavadero: idLavadero
  }
  return fetch("https://www.aquaexpress.com.ar/aqua4d/cloud_totem/qr_scan.php", {
          method: 'POST',
          headers: {
              "Content-type": "application/json",
              "Api-Key": "A1J8or4tKOYzU1ldizQUHVPu07zEFhgd"
          },
          body: JSON.stringify(data)
      })
      .then(async function(response) {
          if (response.ok) {
              let res = await response.json()
              return { status: 'success', ...res }
          } else {
              let res = await response.json()
              console.log(res)
              switch (response.status) {
                  case 402:
                      return { status: 'rejected', ...res }
                      break;
                  case 400:
                  case 401:
                  case 500:
                      if (res.description) {
                          return { status: 'error', description: 'Error de sistema. Intentá nuevamente.' }
                      } else {
                          return { status: 'error', description: 'Error de sistema. Intentá nuevamente.' }
                      }
                      break;
                  case 403:
                      return { status: 'warning', description: res.description }
                      break;
                  case 409:
                      throw new Error(res.description)
                      break;
                  default:
                      console.error(res)
                      return { status: 'error', description: 'Error desconocido. Intente nuevamente.' }
                      break;
              }
          }
      })
}

async function qrPromo(idLavadero) {
  let data = {
      mail: email,
      id_lavadero: idLavadero,
      id_promo: idPromo,
      lavado_promo: lavadoPromo
  }
  return fetch("https://www.aquaexpress.com.ar/aqua4d/cloud_totem/qr_scan_promo.php", {
          method: 'POST',
          headers: {
              "Content-type": "application/json",
              "Api-Key": "A1J8or4tKOYzU1ldizQUHVPu07zEFhgd"
          },
          body: JSON.stringify(data)
      })
      .then(async function(response) {
          if (response.ok) {
              let res = await response.json()
              return { status: 'success', ...res }
          } else {
              let res = await response.json()
              console.log(res)
              switch (response.status) {
                  case 402:
                      return { status: 'rejected', ...res }
                      break;
                  case 400:
                  case 401:
                  case 500:
                      if (res.description) {
                          return { status: 'error', description: 'Error de sistema. Intentá nuevamente.' }
                      } else {
                          return { status: 'error', description: 'Error de sistema. Intentá nuevamente.' }
                      }
                      break;
                  case 403:
                      return { status: 'warning', description: res.description }
                      break;
                  case 409:
                      throw new Error(res.description)
                      break;
                  default:
                      console.error(res)
                      return { status: 'error', description: 'Error desconocido. Intente nuevamente.' }
                      break;
              }
          }
      })
}

function actualiza_qr() {
  img_qr.getElementsByTagName('canvas')[0]?.remove()
  qr.classList.add(['spinner-simple'])
  var data = `accion=52&api_key=ojpEJmCMNjjfX0zRyrASOAWFpgOp2eGD&email=${idPromo?(email+'#'+idPromo+'#'+lavadoPromo):email}`;
  return fetch1("https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php", {
   method: 'POST',
   headers: {
     "Content-type": "application/x-www-form-urlencoded"
   },
   body: data
  })
  .then(function(response) {
     if (response.ok) {
         return response.text()
       } else {
      pageStatus('Error', 'Ha ocurrido un error en el sistema. Intentá de nuevo', 'error')
    }
   })
    .then(function(text) {
      var respuesta = text.split("#");
      if (respuesta.length >= 2) {
        var tiempo_qr = (parseInt(respuesta[1]) + 1) * 1000;
        setTimeout(actualiza_qr, tiempo_qr);
        generar_qr(respuesta[0]);
        } else {
        Swal.fire("Ups!", "Estamos teniendo problemas técnicos. Intentá de nuevo", "error")
        .then(value => {
          location.replace("loged.html");
        })
      }
      })
    .catch(() => {
      label_msg('Conexión a internet inestable')
    })
}

function generar_qr(cadena_qr) {
  const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    type: "canvas",
    data: cadena_qr,
    margin:15,
    qrOptions: {
      typeNumber: 0,
      mode: "Byte",
      errorCorrectionLevel: "M",
    },
  });

  qrCode.append(img_qr);
  img_qr.style = ""
  qr.classList.remove(['spinner-simple'])
}

$("#atras").click(function() {
    location.replace(idPromo ? 'cupones.html' : 'loged.html')
})

document.addEventListener("backbutton", function() { location.replace(idPromo ? 'cupones.html' : 'loged.html') }, true);
window.onunload = function(e) {
    clearInterval(torchTimeoutID)
    QRScanner.destroy(status => {
        console.log(status)
    })
    return;
}
var boton_login = document.getElementById("login_submit");
var boton_show = document.getElementById("pass_show");
var email = document.getElementsByName("femail")[0];
var pass = document.getElementsByName("fpass")[0];
var win = document.getElementById("win");
var show_state = 0;
var chg_pass1;
var chg_pass2;
var enable_cordovaFetch

function fetch1(url,opt){
  if(enable_cordovaFetch == undefined)
    return fetch(url,opt);
  else
    return cordovaFetch(url,opt);
}

/*function test_conexion()
{
   var url1 = prompt("Enter URL", "")
   if (url1 == null || url1 == "") {
      return;
    }

    var metod = prompt("Enter method", "")


    var xhttp = new XMLHttpRequest();
     xhttp.open(metod, url1, true);
     xhttp.setRequestHeader("Content-type", "text/plain");
     xhttp.send("");
     xhttp.onreadystatechange = function() {
         if (xhttp.readyState == 4 && xhttp.status == 200) {
            console.log (xhttp.XMLHttpRequest);
         }
     }
}*/

function consulta_suscripcion(){

  //  localStorage.setItem("suscripto","NADA");

   const email = localStorage.getItem("email");

   fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/set_suscripcion/"+email, {
   method: 'GET'
  })
  .then(function(response) {
     if(response.ok) {
         return response.json();
     }
   })
   .then(function(texto) {
        console.log(texto);
        var suscrip = texto
        if(suscrip.items[0].tipo_suscripcion !== "1")
          {
          localStorage.setItem("suscripto","true");

          // return "true"
          }
        else {
          localStorage.setItem("suscripto","false");
          // return "true"
        }
       })

    .catch(function(err) {
      // Swal.fire("Ups!","No se pudo consultar tu suscripción", "warning")
      localStorage.setItem("suscripto","true");
      // return "true"
    })

}

function consulta_saldo()
{

  // consulta_suscripcion(); Cambiado de lugar despues de consulta_saldo()

  const data = "accion=55&api_key=ojpEJmCMNjjfX0zRyrASOAWFpgOp2eGD&email="+localStorage.getItem("email");
  return fetch1("https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php", {
   method: 'POST',
   headers: {
        "Content-type": "application/x-www-form-urlencoded",
   },
   body: data
  })
  .then(function(response) {
     if(response.ok) {
         return response.text()
     } else {
      $("#autolog_screen").hide();
      Swal.fire("Ups!","Hay un problema con la conexión. Intentá de nuevo", "warning")
     }
  })
  .then(function(texto) {
    var aux=texto.split("#");
    if(aux[0].includes("OK"))
    {
      localStorage.setItem("pesos",aux[1]);
      localStorage.setItem("tag_nro",aux[4]);
      localStorage.setItem("tag_lock",aux[3]);
      Swal.close();
      location.replace("loged.html");
    }
    else
    {
    $("#autolog_screen").hide();
    Swal.fire("Ups!","Tenemos problemas técnicos. Intentá de nuevo", "error")
    }

  })
  .catch(function(err) {
    $("#autolog_screen").hide();
    Swal.fire("Ups!","Tenemos problemas técnicos. Intentá de nuevo", "error")
  })
}

function cambiar_pass()
{
  chg_pass1=""
  chg_pass2=""

  Swal.mixin({
  input: 'password',
  confirmButtonText: 'Siguiente &rarr;',
  showCancelButton: false,
  progressSteps: ['1', '2']
}).queue([
  {
    title: 'Cambio de contraseña',
    text: 'Ingresa tu nueva contraseña',
    preConfirm: (login) => {
      chg_pass1=login;
    }
  },
  {
    title: 'Cambio de contraseña',
    text: 'Ingresala nuevamente',
    showLoaderOnConfirm: true,
    preConfirm: (login) => {
      chg_pass2=login;
      if (chg_pass1=="") {
        Swal.fire("","Debés ingresar una contraseña", "error")
      }
      else {
        if(chg_pass1 == chg_pass2){

          return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/change_password/", {
           method: 'PUT',
           headers: {
                "Content-type": "application/x-www-form-urlencoded",
                "Connection": "close",
                "p_login": email.value,
                "p_newpassword": chg_pass1,
                "p_newpassword_again": chg_pass2,
                "p_oldpassword": pass.value
              },
              body: ""
          })
          .then(function(response) {
             if(response.ok) {
                 return response.text()
             } else {
                 Swal.fire("Ups!","Hay un problema con la conexión. Intentá de nuevo", "warning")
             }
          })
          .then(function(texto) {
              swal.close()
              if(texto.includes("Cambio de contraseña realizado correctamente"))
                {
                Swal.fire("Perfecto!","Ya cambiaste tu contraseña! Ahora ingresa nuevamente", "success")
                pass.value="";
                }
              else if(texto.includes("simple"))
                {
                Swal.fire("Revisá tu contraseña","La contraseña es muy simple", "error")
                }
              else if(texto.includes("caracteres"))
                {
                Swal.fire("Revisá tu contraseña","Recordá que debe tener al menos 6 caracteres", "error")
                }
              else
                {
                Swal.fire("Ups!","Estamos teniendo problemas técnicos. Intentá de nuevo", "warning")
                }
            
          })
          .catch(function(err) {
              if(err){
                Swal.fire("Ups!","Estamos teniendo problemas técnicos. Intentá de nuevo", "warning")
              }
              else{
                swal.stopLoading()
                swal.close()
              }
          })
          }
          else{
            Swal.fire("","Las contraseñas no coinciden", "error")
          }
          }
        }
      }
      ])
}

function verificar_login (login_data)
{
  email.disabled = false;
  pass.disabled = false;
  if(login_data.p_msg.includes("Acceso correcto")) //login ok
    {
      if(login_data.reset_password.includes("SI"))
      {
        cambiar_pass();
      }
      else
      {
        var usr_name=login_data.nombre;
        var usr_surname=login_data.apellido;
        var valor_credito=login_data.p_valor_credito;
        if(login_data.dni)
        {
          var usr_dni=login_data.dni;
        }
        else {
          var usr_dni=""
        }
        var usr_puntos=login_data.p_puntos;

        localStorage.setItem("email", email.value);
        localStorage.setItem("pass", pass.value);
        localStorage.setItem("name", usr_name);
        localStorage.setItem("surname", usr_surname);
        localStorage.setItem("puntos", usr_puntos);
        localStorage.setItem("dni", usr_dni);
        localStorage.setItem("valor_cred", valor_credito);

        localStorage.setItem("logued", true);
        
        location.replace("loged.html");

        // consulta_suscripcion();
        // consulta_saldo();
        

    }
  }

  else if(login_data.p_msg.includes("Usuario o contraseña inválida"))
    {
    localStorage.clear();
    $("#autolog_screen").hide();
    Swal.fire("","Usuario y/o contraseña incorrectos", "error")
    }
  else if(login_data.p_msg.includes("El usuario aun no confirmó su correo electrónico"))
    {
    $("#autolog_screen").hide();
    Swal.fire("Confirmanos tu email", "Revisá tu correo y hace click en el link que te enviamos!", "warning")
    }
}

function cambio_pass()
{
Swal.fire({
title: 'Ingresá tu email',
text: "Te enviaremos instrucciones para recuperar tu contraseña",
input: 'email',
inputAttributes: {
  autocapitalize: 'off'
},
showCancelButton: true,
cancelButtonText: 'Cancelar',
confirmButtonText: 'Enviar',
showLoaderOnConfirm: true,
reverseButtons: true,
allowOutsideClick: false,
preConfirm: (login) => {

  if (login=="") return null;

  return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/forgotpassword/", {
   method: 'PUT',
   headers: {
        "Content-type": "application/x-www-form-urlencoded",
        "p_login": login
   },
   body: ""
  })
    .then(response => {
      if (!response.ok) {
        Swal.fire("Ups!","Hay un problema con la conexión. Intentá de nuevo", "warning")
      }
      else{
        return response.text()
      }
    })
    .then(function(texto) {
        swal.close()
        if(texto.includes("El usuario no existe"))
          {
          Swal.fire("Ups!","El mail que ingresate no esta registrado. Revisalo e intenta de nuevo", "warning")
          }
        else if(texto.includes("Mail de cambio de contraseña enviado"))
          {
          Swal.fire("Perfecto!","Ahora revisá tu email! Te enviamos las instrucciones para ingresar nuevamente", "success")
          }
        else
          {
          Swal.fire("Ups!","Estamos teniendo problemas técnicos. Intentá de nuevo", "error")
          }
        })

    .catch(error => {
      Swal.showValidationMessage(
        `Ups! Estamos teniendo problemas técnicos. Intentá de nuevo.`
      )
    })
}
})


}

const Toast = Swal.mixin({
  toast: false,
  position: 'center',
  showConfirmButton: true,
})

var show_pass = false;
function togglepass(){
  if (show_pass){
    pass.setAttribute("type","password")
    show_pass = false;
  }else{
    pass.setAttribute("type","text")
    show_pass = true;
  }
}


boton_login.onclick = function() {

  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.value))
    {
    }
  else
    {
    Toast.fire({
      icon: 'warning',
      text: 'Ingresá un email valido',
    })
    return (false)
    }

  if(pass.value==="")
    {
    Toast.fire({
      icon: 'warning',
      text: 'Ingresá tu contraseña'
    })
    return(false);
    }

  email.disabled = true;
  pass.disabled = true;

  if(localStorage.getItem("logued")!=="true")
  {
    Swal.fire({
      text: "Iniciando sesión...",
      allowOutsideClick: false,
      onBeforeOpen: () => {
      Swal.showLoading()}
    })
  }

  return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/login/", {
   method: 'POST',
   headers: {
        "Content-type": "application/x-www-form-urlencoded",
        "p_login": email.value,
        "p_password": pass.value
   },
   body: ""
  })
  .then(function(response) {
     if(response.ok) {
         return response.text()
     } else {
      email.disabled = false;
      pass.disabled = false;
      Swal.fire("Ups!","Hay un problema con la conexión. Intentá de nuevo", "warning")
     }
  })
  .then(function(texto) {
      // Swal.close();
      var respuesta = JSON.parse(texto);
      verificar_login(respuesta);
  })

  .catch(function(err) {
    email.disabled = false;
    pass.disabled = false;
    Swal.fire("Ups!","Tenemos problemas técnicos. Intentá de nuevo<br>", "error")
  })


}

window.onload = function(){
  $("body").fadeIn(200);

  if(localStorage.getItem("logued")==="true")
  { 
    $("#autolog_screen").show();
    email.value=localStorage.getItem("email");
    pass.value=localStorage.getItem("pass");
    name=localStorage.getItem("name");

    if(enable_cordovaFetch == undefined)
        boton_login.onclick();
    else
      document.addEventListener("deviceready", boton_login.onclick, false);
    }
  else {
    $("#autolog_screen").hide();
  }

}

$("#atras").click(function(){
  location.replace("welcome.html")
})

document.addEventListener("backbutton", function(){location.replace("welcome.html")}, true);

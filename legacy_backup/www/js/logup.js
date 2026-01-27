var boton_logup = document.getElementById("logup_submit");
var mayor_edad = document.getElementById("mayor_edad");
var boton_show= document.getElementById("pass_show1");
var boton_show1 = document.getElementById("pass_show2");
var name2 = document.getElementsByName("r_name")[0];
var surname = document.getElementsByName("r_surname")[0];
var email = document.getElementsByName("r_mail")[0];
var pass1 = document.getElementsByName("r_pass1")[0];
var show_state=0;
var win =  document.getElementById("win");
var enable_cordovaFetch

function fetch1(url,opt){
  if(enable_cordovaFetch == undefined)
    return fetch(url,opt);
  else
    return cordovaFetch(url,opt);
}


const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: false,
})

//win.style.cssText = 'height: '+screen.height+'px;';

// function verificar_logup (login_data)
// {
//   if(login_data.includes("CREADO")) //login ok
//     {
//       Swal.fire("Perfecto!", "Ya creamos tu usuario. Ahora revisa tu correo para confirmar tu cuenta. Bienvenido!", "success")
//       .then((value) => {
//         location.replace("login.html");
//       });
//     }
//   else if(login_data.includes("EXISTE"))
//     {
//     Swal.fire("El mail ingresado ya esta en uso", "Si olvidaste la contraseña podes recuperarla!", "warning", {
//       buttons: { catch: { text: "Recuperar",  value: "catch"},OK: true}})
//       .then((value) => {
//         if(value=="catch"){
//           location.repalce("index.html");
//         }
//       });
//     }
//   else
//     {
//     confirm("Error interno");
//     }
// }

// Asignar la función externa al elemento
// boton_show.onfocus = function() {
//       pass1.type = "text";
// }

// boton_show.onblur = function() {
//       pass1.type = "password";
// }

var show_pass = false;
function togglepass(){
  if (show_pass){
    pass1.setAttribute("type","password")
    show_pass = false;
  }else{
    pass1.setAttribute("type","text")
    show_pass = true;
  }
}

// Asignar la función externa al elemento
boton_logup.onclick = function() {
  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.value.toLowerCase()))
    {
      Toast.fire({
        icon: 'warning',
        title: 'Ingresá un email valido',
        background: "#eff2f9"
      })
      return (false)
    }

  if(pass1.value==="" || name2.value==="" || surname.value==="")
    {
      Toast.fire({
        icon: 'warning',
        title: 'Completá todos los campos',
        background: "#eff2f9"
      })
      return(false);
    }
    email.value =  email.value.toLowerCase()
    Swal.fire({
    text: "Espera...",
    width: "50%",
    allowOutsideClick: false,
    onBeforeOpen: () => {
    Swal.showLoading()
    }
    })

    return fetch1("http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/registeruser/", {
     method: 'POST',
     headers: {
          "Content-type": "application/x-www-form-urlencoded",
          "Connection": "close",
          "p_apellido": surname.value,
          "p_nombre": name2.value,
          "p_login": email.value,
          "p_password": pass1.value
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
        if(texto.includes("correctamente"))
          {
          Swal.fire("Perfecto!","Ahora ingresá a tu cuenta de correo y confirmá tu e-mail", "success")
          }
        else if(texto.includes("existe"))
            {
            Swal.fire("Ups!","Ese e-mail ya esta registrado. Si te olvidaste la contraseña podés cambiarla", "warning")
            }
        else if(texto.includes("contraseña"))
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


  //var params = "accion=51&email="+email.value+"&pass="+pass1.value+"&nombre="+name2.value; //PARAMETROS

/*
  //crea la billetera virtual despues de haber creado en usuario en aquaexpress
  var url = "https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php"; //URL del servidor
  var params = "accion=51&email="+email.value; //PARAMETROS

  //Abres la conexion a la URL
  http.open("POST", url, true);

  //Envias el header requerido para enviar parametros via POST
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.setRequestHeader("Connection", "close");
  http.send(params);
  */
}


window.onload = function(){
  $("body").fadeIn(200);
}

$("#atras").click(function(){
  location.replace("welcome.html")
})

document.addEventListener("backbutton", function(){location.replace("welcome.html")}, true);

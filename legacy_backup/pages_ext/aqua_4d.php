<?php

header("Access-Control-Allow-Headers: Authorization, Content-Type");
header("Access-Control-Allow-Origin: *");

$fecha = date("Y") . date("m") . date("d");
$hora = date("H") . date("i") . date("s");

$desde = htmlspecialchars($_POST['desde']);
$hasta = htmlspecialchars($_POST['hasta']);

$ahora = date("Y") . "-" . date("m") . "-" . date("d") . " " . date("H") . ":" . date("i") . ":" . date("s");

$dato_encriptado = htmlspecialchars($_POST['cadena']);
$encrypt_method = "AES-256-CBC";
$secret_key = 'Que Kap0s L0s InGeni3r05 K De54rR0ll@r0n 3570';

$lavadero = htmlspecialchars($_POST['lavadero']);
$id_lavadero = htmlspecialchars($_POST['id_lavadero']);
$pass = htmlspecialchars($_POST['pass']);
$nombre = htmlspecialchars($_POST['nombre']);
$id = (int) $_POST['id'];
$mail_aux = htmlspecialchars($_POST['mail_aux']);
$mail = htmlspecialchars($_POST['mail']);
$tarjeta = htmlspecialchars($_POST['tarjeta']);
$id_tarj = htmlspecialchars($_POST['id_tarj']);
$recarga = htmlspecialchars($_POST['recarga']);

$accion = (int) $_POST['accion'];

$email = htmlspecialchars($_POST['email']);
$promo = htmlspecialchars($_POST['promo']);
$a_cobrar = $_POST['a_cobrar'];
$cant_creditos = $_POST['cant_cred'];
$consumo = htmlspecialchars($_POST['consumo']);
$comando = $_POST['comando'];
$bloqueo = (int) $_POST['bloqueo'];

$MyUsername = "c1681294_ue";
$MyPassword = "Aqua4DuE";
$MyHostname = "localhost";
$MyDb = "c1681294_aqua_4d";

// This function will return a random
// string of specified length
function random_strings($length_of_string)
{
    // String of all alphanumeric character
    $str_result = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Shufle the $str_result and returns substring
    // of specified length
    return substr(str_shuffle($str_result), 0, $length_of_string);
}

$conexion = mysqli_connect($MyHostname, $MyUsername, $MyPassword, $MyDb);
if (!$conexion)
    echo "ERROR";

switch ($accion) {
    case 1: // Crea Nuevo Lavadero
    {
        $registros = mysqli_query($conexion, "SELECT id FROM lavaderos WHERE nombre = '$lavadero'");
        if ($registros == NULL)
            echo "ERROR CONSULTA";

        $count = 0;
        while ($reg = mysqli_fetch_array($registros))
            $count++;

        if ($count >= 1)
            echo "EXISTE";
        else {
            $reg = mysqli_query($conexion, "INSERT INTO " . $MyDb . ".lavaderos (nombre,pass, lavado_rapido, lavado_express, lavado_full, lavado_extra_full, actualizar) VALUES ('$lavadero','1234', 0, 0, 0, 0, 0)");
            if ($reg == NULL)
                echo "ERROR CONSULTA 1";

            $reg = mysqli_query($conexion, "CREATE TABLE IF NOT EXISTS " . $lavadero . "_recargas ( id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY, fecha DATE, hora TIME, usuario INT(10), carga INT(10), tipo VARCHAR(10), nro_tarjerta VARCHAR(20), cajero VARCHAR(20) )");
            if ($reg == NULL)
                echo "ERROR CONSULTA 2";

            $reg = mysqli_query($conexion, "CREATE TABLE IF NOT EXISTS " . $lavadero . "_consumos ( id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY, fecha DATE, hora TIME, consumo INT(10), lavado VARCHAR(15), nro_tarjerta VARCHAR(20),  usuario INT(10), forma VARCHAR(5))");
            if ($reg == NULL)
                echo "ERROR CONSULTA 3";

            echo "OK";
        }
        mysqli_close($conexion);
    }
        break;

    case 2: // Carga credito desde la estación de recarga
    {
        $registros = mysqli_query($conexion, "UPDATE wallet SET saldo=saldo+$recarga WHERE nro_tarjeta='$tarjeta'");
        if ($registros != NULL) {
            $afectadas = mysqli_affected_rows($conexion);

            if ($afectadas == 0)
                echo "NO_REG";
            else if ($afectadas == 1) {
                $resp2 = mysqli_query($conexion, "INSERT INTO " . $MyDb . "." . $lavadero . "_recargas (fecha, hora, carga, tipo, nro_tarjeta) VALUES ($fecha, $hora, $recarga, 'RECARGA', '$tarjeta')");
                echo "OK_CARGA#" . $recarga;

                $registros = mysqli_query($conexion, "SELECT mail, mail_aux FROM wallet WHERE nro_tarjeta='$tarjeta'");
                if ($registros != NULL) {
                    while ($usuario = mysqli_fetch_array($registros)) {
                        $mail = $usuario["mail"];
                        if (empty($mail)) {
                            $mail = $usuario["mail_aux"];
                        }
                    }

                    $url = 'http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/register_puntos/';
                    $ch = curl_init($url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
                    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                        'p_login: ' . $mail,
                        'p_monto: ' . $recarga,
                        'p_origen: LOCAL',
                        'p_computar4D: SI',
                        'p_code_external: ' . $lavadero
                    ));
                    curl_exec($ch);
                }

            } else
                echo "ERROR";
        } else
            echo "ERROR";
        mysqli_close($conexion);
    }
        break;

    case 3: // Borra credito desde la estación de recarga
    {
        $registros = mysqli_query($conexion, "UPDATE wallet SET saldo=saldo-$recarga WHERE nro_tarjeta='$tarjeta'");
        if ($registros != NULL) {
            $afectadas = mysqli_affected_rows($conexion);

            if ($afectadas == 0)
                echo "NO_REG";
            else if ($afectadas == 1) {
                $resp2 = mysqli_query($conexion, "INSERT INTO " . $MyDb . "." . $lavadero . "_recargas (fecha, hora, carga, tipo, nro_tarjeta) VALUES ($fecha, $hora, $recarga, 'BORRA', '$tarjeta')");
                echo "OK_BORRA#" . $recarga;

                $registros = mysqli_query($conexion, "SELECT mail, mail_aux FROM wallet WHERE nro_tarjeta='$tarjeta'");
                if ($registros != NULL) {
                    while ($usuario = mysqli_fetch_array($registros)) {
                        $mail = $usuario["mail"];
                        if (empty($mail)) {
                            $mail = $usuario["mail_aux"];
                        }
                    }


                    $url = 'http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/register_puntos/';
                    $ch = curl_init($url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
                    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                        'p_login: ' . $mail,
                        'p_monto: ' . -$recarga,
                        'p_origen: LOCAL',
                        'p_computar4d: SI',
                        'p_code_external: ' . $lavadero
                    ));
                    curl_exec($ch);
                }
            } else
                echo "ERROR";
        } else
            echo "ERROR";
        mysqli_close($conexion);
    }
        break;

    case 4: // Consulta credito desde la estación de recarga
    {
        $registros = mysqli_query($conexion, "SELECT nombre, mail, mail_aux, saldo, id_tarj FROM wallet WHERE nro_tarjeta='$tarjeta'");
        if ($registros != NULL) {
            $count = 0;
            while ($usuario = mysqli_fetch_array($registros)) {
                $id_tarj = $usuario["id_tarj"];
                $nombre = $usuario["nombre"];
                $mail = $usuario["mail"];
                $mail_aux = $usuario["mail_aux"];
                $billetera = $usuario["saldo"];
                $count++;
            }

            if ($count == 0)
                echo "NO_REG";
            else if ($count == 1) {
                if (strlen($id_tarj) <= 1)
                    $id_tarj = "-";
                if (strlen($mail) <= 1) // Tarjeta no vinculada
                    echo "OK_CONSULTA#" . $billetera . "#" . $id_tarj . "#" . $mail_aux;
                else // Tarjeta vinculada a usuario
                    echo "OK_CONSULTA#" . $billetera . "#" . $nombre . "#" . $mail;
            } else
                echo "DUPLICADA";
        } else
            echo "ERROR_ID";
        mysqli_close($conexion);
    }
        break;

    case 5: // Alta de tarjeta
    {
        // 1° Me fijo si la tarjeta está registrada.
        $registros = mysqli_query($conexion, "SELECT id FROM wallet WHERE nro_tarjeta='$tarjeta'");
        if ($registros == NULL) {
            echo "ERROR";
            break;
        } else {
            $count = 0;
            while ($usuario = mysqli_fetch_array($registros))
                $count++;

            if ($count >= 1) // La tarjeta ya existe en la DB, no se puede asociar a nadie
            {
                echo "EXISTE";
                break;
            } else {
                /////////////////////////////////////// Agregado el 2/6/2022 ////////////////////////////////////////

                // Me fijo si el mail existe en "mail_aux"
                $registros = mysqli_query($conexion, "SELECT id_tarj FROM wallet WHERE mail_aux='$mail_aux'");
                if ($registros != NULL) {
                    $count = 0;
                    while ($datos = mysqli_fetch_array($registros)) {
                        $id_tarj = $datos["id_tarj"];
                        $count++;
                    }

                    if ($count > 1) {
                        echo "ERROR";
                        break;
                    }

                    // Si existe ese mail en la base de datos
                    else if ($count == 1) {
                        $registros = mysqli_query($conexion, "UPDATE wallet SET nro_tarjeta='$tarjeta' WHERE mail_aux='$mail_aux'");
                        if ($registros != NULL) {
                            $afectadas = mysqli_affected_rows($conexion);

                            if ($afectadas == 0) {
                                echo "ERROR";
                                break;
                            } else if ($afectadas == 1) {
                                echo "OK_ALTA#" . $id_tarj;
                                break;
                            }
                        }
                    }

                    // Si no existe el "mail_aux"
                    else if ($count == 0) {
                        loop:
                        $id_tarj = random_strings(8);
                        $registros = mysqli_query($conexion, "SELECT id FROM wallet WHERE id_tarj='$id_tarj'");
                        if ($registros == NULL) {
                            echo "ERROR";
                            break;
                        }
                        while ($usuario = mysqli_fetch_array($registros))
                            $count++;
                        if ($count > 0)
                            goto loop;
                    }
                }
                //////////////////////////////////////////////////////////////////////////////////////////////////

            }
        }

        // 2° Si la tarjeta no existe en la base de datos, creo una fila con esa tarjeta y el qr de la misma
        $registros = mysqli_query($conexion, "INSERT INTO " . $MyDb . ".wallet (nro_tarjeta, id_tarj, mail_aux) VALUES ('$tarjeta', '$id_tarj', '$mail_aux')");
        if ($registros == NULL)
            echo "ERROR";
        else {
            echo "OK_ALTA#" . $id_tarj;

            $nombre_aux = explode("@", $mail_aux)[0];

            //Registra el usuario
            $url = "http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/registeruser/";
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                "p_nombre: " . $nombre_aux,
                "p_login: " . $mail_aux,
                "p_password: " . $id_tarj
            ));
            curl_exec($ch);

        }

        mysqli_close($conexion);
    }
        break;

    case 6: //Consulta listado de lavaderos
    {
        $resp = mysqli_query($conexion, "SELECT nombre FROM lavaderos");
        $count = 0;

        while ($row = mysqli_fetch_array($resp)) {
            $lavaderos[$count] = $row;
            $count++;
        }

        for ($x = 0; $x < $count; $x++) {
            if ($x == $count - 1)
                echo $lavaderos[$x]["nombre"];
            else
                echo $lavaderos[$x]["nombre"] . ",";
        }
        mysqli_close($conexion);
    }
        break;

    case 7: //login app estacion de recarga
    {
        $registros = mysqli_query($conexion, "SELECT id FROM lavaderos WHERE nombre='$lavadero' AND pass='$pass'");
        if ($registros == NULL)
            echo "ERROR";

        $count = 0;
        while ($reg = mysqli_fetch_array($registros))
            $count++;

        if ($count == 1)
            echo "LOGIN OK";
        else
            echo "ERROR";

        mysqli_close($conexion);
    }
        break;

    case 8: // Asocio tarjeta a usuario por QR desde la estacion de recarga - NO SE USA
    {
        /*$registros=mysqli_query($conexion, "SELECT iv FROM iv WHERE id=1");
        $count = 0;
        while($reg = mysqli_fetch_array($registros))
        {
            $arr=$reg;
            $count++;
        }

        if($count==1)
            $secret_iv=$arr["iv"];

        $iv = substr(hash('sha256', $secret_iv), 0, 16);
        $key = hash('sha256', $secret_key);
        $mail=openssl_decrypt(base64_decode($dato_encriptado), $encrypt_method, $key, 0, $iv);

        // 1° Me fijo si la tarjeta está registrada.
        $registros=mysqli_query($conexion, "SELECT id, mail, verif FROM wallet WHERE nro_tarjeta='$tarjeta'");
        if($registros==NULL)
        {
            echo "ERROR";
            break;
        }
        else
        {
            $count = 0;
            while($usuario = mysqli_fetch_array($registros))
                $count++;

            if($count==1) // La tarjeta existe en la DB
            {
                if($usuario["mail"]==$mail)
                {
                    if($usuario["verif"]==3)
                        echo "TARJ_VINC";
                    else
                        echo "NOSE";
                }
                else
                    echo "EXISTE";
                break;
            }
        }

        // La tarjeta no está registrada en la base de datos
        $resp=mysqli_query($conexion, "UPDATE wallet SET nro_tarjeta='$tarjeta', verif=3 WHERE mail='$mail' AND verif>=2");
        if($resp==0)
            echo "ERROR";
        else
        {
            mysqli_query($conexion, "DELETE FROM wallet WHERE mail='$mail' AND verif=1");

            $resp=mysqli_query($conexion, "SELECT id FROM wallet WHERE mail='$mail'");
            if($resp==0)
                echo "ERROR";
            else
            {
               $count = 0;
                while($row = mysqli_fetch_array($resp))
                {
                    $count++;
                    $id=$row["id"];
                }

                if($count==1)
                    echo "OK_VINC#".$id;
                else
                    echo "ERROR";
            }
        }

        mysqli_close($conexion); */
    }
        break;

    case 9: // Consulta resumen movimientos desde la estacion de recarga
    {
        $resp = mysqli_query($conexion, "SELECT fecha, hora, usuario, carga, tipo FROM " . $lavadero . "_recargas ORDER BY id DESC LIMIT 30");

        $count = 0;
        while ($row = mysqli_fetch_array($resp)) {
            $arr[$count] = $row;
            $count++;
        }
        if ($count == 0)
            echo "NO HAY MOVIMIENTOS,";
        else {
            echo "RECARGAS,\n";
            for ($x = 0; $x < $count; $x++) {
                $fecha_ord = date("d/m/Y", strtotime($arr[$x]["fecha"]));
                $hora_ord = date("H:i", strtotime($arr[$x]["hora"]));

                if ($x == ($count - 1))
                    echo $fecha_ord . " (" . $hora_ord . "hs)\n> Usuario: " . $arr[$x]["usuario"] . "\n> " . $arr[$x]["tipo"] . ": $" . $arr[$x]["carga"] . "\n";
                else
                    echo $fecha_ord . " (" . $hora_ord . "hs)\n> Usuario: " . $arr[$x]["usuario"] . "\n> " . $arr[$x]["tipo"] . ": $" . $arr[$x]["carga"] . ",\n";
            }
        }
        mysqli_close($conexion);
    }
        break;

    ///////////////App de usuario///////////////////////////////////////////////////////

    /*case 51: //Registro Nuevo Usuario (22)
    {
        $registros=mysqli_query($conexion, "SELECT id FROM wallet WHERE email='$email'");
        if($registros==NULL)
            echo "ERROR";

        $count = 0;
        while($reg = mysqli_fetch_array($registros))
            $count++;

        if($count >= 1)
            echo "EXISTE";
        else
            mysqli_query($conexion, "INSERT INTO ".$MyDb.".wallet (mail, saldo) VALUES ('$email', 0)");

        mysqli_close($conexion);
    }break;*/

    case 52: //Encripta datos pago qr (23)
    {
        $registros = mysqli_query($conexion, "SELECT iv, estampa FROM iv WHERE id=1");

        $count = 0;
        while ($reg = mysqli_fetch_array($registros)) {
            $arr[0] = $reg;
            $count++;
        }

        if ($count == 1) {
            $secret_iv = $arr[0]["iv"];
            $stamp = $arr[0]["estampa"];
        }

        $iv = substr(hash('sha256', $secret_iv), 0, 16);
        $key = hash('sha256', $secret_key);

        $encrypted_data = openssl_encrypt($email, $encrypt_method, $key, 0, $iv);
        $plain_text = base64_encode($encrypted_data);
        $diff = 300 - (strtotime($ahora) - strtotime($stamp));

        if ($diff < 0) //esto pasa cuando el cron no actualiza el iv
        {
            echo $plain_text . "#15";
        } else {
            echo $plain_text . "#" . $diff;
        }

    }
        break;

    case 53: //Desencripta datos (24)
    {
        $registros = mysqli_query($conexion, "SELECT iv FROM iv WHERE id=1");

        $count = 0;
        while ($reg = mysqli_fetch_array($registros)) {
            $arr[0] = $reg;
            $count++;
        }

        if ($count == 1) {
            $secret_iv = $arr[0]["iv"];
        }

        $iv = substr(hash('sha256', $secret_iv), 0, 16);
        $key = hash('sha256', $secret_key);

        $email = openssl_decrypt(base64_decode($dato_encriptado), $encrypt_method, $key, 0, $iv);
        $registros = mysqli_query($conexion, "SELECT saldo, id FROM wallet WHERE email = '$email' ORDER BY id ASC LIMIT 1");

        $count = 0;
        while ($reg = mysqli_fetch_array($registros)) {
            $arr[0] = $reg;
            $count++;
        }

        if ($count >= 1) {
            $billetera = $arr[0]["saldo"];
            $id = $arr[0]["id"];

            if ($billetera >= $consumo) {
                $resp = mysqli_query($conexion, "UPDATE wallet SET wallet.saldo=wallet.saldo-$consumo WHERE email = '$email' ORDER BY id ASC LIMIT 1");
                $billetera = $billetera - $consumo;
                echo "OK" . "#" . $billetera;
                //aca deberia ir el registro de consumo
                //mysqli_query($conexion, "INSERT INTO ".$MyDb.".".$codigo_local."_consumos (fecha, hora, consumo, pulsos, nro_estacion, producto, usuario, forma) VALUES ($fecha, $hora, $consumo, $pulsos, $nro_serie, '$producto', $id, 'QR')");
            } else {
                echo "INS" . "#" . $billetera;
            }
        } else {
            echo "ERR";
        }

        mysqli_close($conexion);
    }
        break;

    case 54: //Encripta promo (25)
    {
        $registros = mysqli_query($conexion, "SELECT iv, estampa FROM iv WHERE id=1");

        $count = 0;
        while ($reg = mysqli_fetch_array($registros)) {
            $arr[0] = $reg;
            $count++;
        }

        if ($count == 1) {
            $secret_iv = $arr[0]["iv"];
            $stamp = $arr[0]["estampa"];
        }

        $iv = substr(hash('sha256', $secret_iv), 0, 16);
        $key = hash('sha256', $secret_key);

        $encrypted_data = openssl_encrypt($promo, $encrypt_method, $key, 0, $iv);
        $plain_text = base64_encode($encrypted_data);
        $diff = strtotime($ahora) - strtotime($stamp);

        echo $plain_text . "#" . $diff;
    }
        break;

    case 55: //Refresca saldo. Si el usuario no existe lo da de alta  (27)
    {
        $usuario_creado = 0;

        busca_usuario:

        $registros = mysqli_query($conexion, "SELECT saldo,nro_tarjeta,id_tarj,bloq_tarjeta FROM wallet WHERE mail = '$email'");

        $count = 0;
        while ($reg = mysqli_fetch_array($registros)) {
            $arr = $reg;
            $count++;
        }

        if ($count >= 1)
            echo "OK" . $usuario_creado . "#" . $arr["saldo"] . "#" . $arr["nro_tarjeta"] . "#" . $arr["bloq_tarjeta"] . "#" . $arr["id_tarj"];
        else {
            $SQL = "INSERT INTO " . $MyDb . ".wallet (mail,saldo,nombre) VALUES ('$email', 0, '$nombre')";
            mysqli_query($conexion, $SQL);

            if ($usuario_creado == 0) {
                $usuario_creado = 1;
                goto busca_usuario;
            } else {
                echo "ERR";
            }
        }

        mysqli_close($conexion);

    }
        break;

    case 56: //Actualiza precios estacion de cobro (modificar para hacer todo en la misma consulta) !!!!!!!!!!!!!!!!!!!!!!!!
    {
        $dbdata = mysqli_query($conexion, "SELECT * FROM lavaderos WHERE id = '$id'");

        if ($dbdata) {
            $arr = mysqli_fetch_array($dbdata);
        } else {
            $arr = null; // or handle error
        }

        $precio_1 = $arr["lavado_rapido"];
        $precio_2 = $arr["lavado_express"];
        $precio_3 = $arr["lavado_full"];
        $precio_4 = $arr["lavado_extra_full"];
        $actualiza = $arr["actualizar"];

        if ($comando == 1) //Consulta si hay datos para actualizar
        {
            echo $actualiza;
        }

        if ($comando == 2) //Consulta de precios
        {
            printf("%d;%d;%d;%d", $precio_1, $precio_2, $precio_3, $precio_4);
            $dbdata = mysqli_query($conexion, "UPDATE lavaderos SET actualizar=0 WHERE id = '$id'");
        }

    }
        break;

    case 57: //Bloqueo y desbloqueo de tarjeta
    {
        $resp = mysqli_query($conexion, "UPDATE wallet SET bloq_tarjeta=$bloqueo WHERE mail='$email'");
        if ($resp == NULL)
            echo "ERROR";
        else {
            $afectadas = mysqli_affected_rows($conexion);

            if ($afectadas == 0)
                echo "ERROR";
            else if ($afectadas == 1) {
                if ($bloqueo == 1)
                    echo "OK_BLOQ";
                else
                    echo "OK_DESB";
            }
        }

        mysqli_close($conexion);

    }
        break;

    case 58: //Descuenta compra de creditos para autolavado
    {
        $regex = '/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/';
        if (preg_match($regex, $email)) {
            http_response_code(401);
            die("Mail invalido. Revise e intente nuevamente");
        }
        $resp = mysqli_query($conexion, "SELECT saldo FROM wallet WHERE mail='$email' ORDER BY id ASC LIMIT 1");
        $saldo = mysqli_fetch_assoc($resp)["saldo"];
        if ($saldo >= $a_cobrar) {
            $url = "http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/cupones_buy";
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('p_login: ' . $email, 'p_creditos: ' . $cant_creditos, 'p_valido_en: ' . $id_lavadero));

            if (!$result = curl_exec($ch)) {
                die('{"status":"error","msg":"Ocurrió un error al realizar la transacción. Intente nuevamente. (CURLERR) ' . curl_exec($ch) . '"}');
            }
            curl_close($ch);

            if (strpos($result, 'Se ha generado un cupón BUY')) {
                mysqli_query($conexion, "UPDATE wallet SET saldo=saldo-$a_cobrar WHERE mail='$email'");
                die('{"status":"ok","msg":"Ya confirmamos tu compra. Buscá en tus cupones para canjear"}');
            } else {
                http_response_code(500);
                die("Error de servidor. Intente nuevamente. (DBERR001) " . $result);
            }
        } else {
            http_response_code(402);
            die("Saldo insuficiente");
        }
    }
        break;

    case 59: //Asocio o Cambio tarjeta
    {
        $registros = mysqli_query($conexion, "SELECT id, mail, saldo, nro_tarjeta FROM wallet WHERE id_tarj='$id_tarj'");
        if ($registros == NULL)
            echo "ERR";
        else {
            $count = 0;
            while ($reg = mysqli_fetch_array($registros)) {
                $nro_tarjeta = $reg["nro_tarjeta"];
                $saldo_tarjeta = $reg["saldo"];
                $id_borrar = $reg["id"];
                $mail_tarj = $reg["mail"];
                $count++;
            }

            if ($count == 1) {
                if (strlen($mail_tarj) > 1) // Ya se había asociado otra tarjeta
                    echo "YA_ASOCIADA";
                else // Combino info de filas y elimino la fila de sólo tarjeta
                {
                    $resp = mysqli_query($conexion, "UPDATE wallet SET nro_tarjeta='$nro_tarjeta', saldo=saldo+$saldo_tarjeta, id_tarj='$id_tarj' WHERE mail='$mail'");
                    $resp1 = mysqli_query($conexion, "DELETE FROM wallet WHERE id=$id_borrar");

                    if ($resp != NULL && $resp1 != NULL)
                        echo "OK#" . $saldo_tarjeta . "#" . $id_tarj;
                }
            } else if ($count > 1)
                echo "EXISTE";
            else
                echo "NO";
        }

        mysqli_close($conexion);
    }
        break;

    case 60: // Consulta Historial de Actividad Unificada (Consumos + MP)
    {
        $history = array();

        // 1. Consumos (Totem_consumos)
        $query1 = "SELECT Lavado_alias, Monto, Medio_pago, Fecha_operacion, Totem_ID FROM Totem_consumos WHERE Usuario = '$email' ORDER BY Fecha_operacion DESC LIMIT 50";
        $resp1 = mysqli_query($conexion, $query1);
        if ($resp1) {
            while ($row = mysqli_fetch_assoc($resp1)) {
                $history[] = array(
                    'type' => 'consumo',
                    'title' => mb_convert_encoding($row['Lavado_alias'], "UTF-8", "ISO-8859-1"),
                    'amount' => -1 * floatval($row['Monto']), // Consumos restan
                    'date' => $row['Fecha_operacion'],
                    'method' => mb_convert_encoding($row['Medio_pago'], "UTF-8", "ISO-8859-1"),
                    'detail' => "Lavadero: " . mb_convert_encoding($row['Totem_ID'], "UTF-8", "ISO-8859-1")
                );
            }
        }

        // 2. Operaciones MercadoPago (operaciones_mp)
        $query2 = "SELECT id_operation, type, amount, added FROM operaciones_mp WHERE client_mail = '$email' AND status = 'approved' ORDER BY added DESC LIMIT 50";
        $resp2 = mysqli_query($conexion, $query2);
        if ($resp2) {
            while ($row = mysqli_fetch_assoc($resp2)) {
                $titulo = ($row['type'] == 'RECARGA') ? 'Carga de Saldo' : 'Compra de Créditos';
                $history[] = array(
                    'type' => ($row['type'] == 'RECARGA') ? 'recarga' : 'compra_creditos',
                    'title' => $titulo,
                    'amount' => floatval($row['amount']), // Ingresos suman (o value add)
                    'date' => $row['added'],
                    'method' => 'MercadoPago',
                    'detail' => "#" . $row['id_operation']
                );
            }
        }

        // 3. Ordenar por fecha descendente
        usort($history, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        // 4. Limitar a 50 items totales
        $history = array_slice($history, 0, 50);

        echo json_encode($history);
        mysqli_close($conexion);
    }
        break;

    case 70: // Obtener Novedades
    {
        $query = "SELECT * FROM novedades WHERE activo = 1 ORDER BY fecha_publicacion DESC LIMIT 20";
        $resp = mysqli_query($conexion, $query);

        $news = array();
        if ($resp) {
            while ($row = mysqli_fetch_assoc($resp)) {
                $news[] = array_map(function ($str) {
                    return mb_convert_encoding($str, "UTF-8", "ISO-8859-1");
                }, $row);
            }
        }
        echo json_encode($news);
        mysqli_close($conexion);
    }
        break;

    case 71: // Admin: Get All News (inclusive inactive)
    {
        $query = "SELECT * FROM novedades ORDER BY fecha_publicacion DESC";
        $resp = mysqli_query($conexion, $query);
        $news = array();
        if ($resp) {
            while ($row = mysqli_fetch_assoc($resp)) {
                $news[] = array_map(function ($str) {
                    return mb_convert_encoding($str, "UTF-8", "ISO-8859-1");
                }, $row);
            }
        }
        echo json_encode($news);
        mysqli_close($conexion);
    }
        break;

    case 72: // Admin: Save/Update News
    {
        $titulo = isset($_POST['titulo']) ? mb_convert_encoding($_POST['titulo'], "ISO-8859-1", "UTF-8") : '';
        $subtitulo = isset($_POST['subtitulo']) ? mb_convert_encoding($_POST['subtitulo'], "ISO-8859-1", "UTF-8") : '';
        $cuerpo = isset($_POST['cuerpo']) ? mb_convert_encoding($_POST['cuerpo'], "ISO-8859-1", "UTF-8") : '';
        $imagen = isset($_POST['imagen_url']) ? $_POST['imagen_url'] : '';
        $id = isset($_POST['id']) ? $_POST['id'] : null;

        // File Upload Logic
        if (isset($_FILES['imagen_file']) && $_FILES['imagen_file']['error'] == 0) {
            $allowed = ['jpg', 'jpeg', 'png', 'webp'];
            $filename = $_FILES['imagen_file']['name'];
            $filetype = $_FILES['imagen_file']['type'];
            $filesize = $_FILES['imagen_file']['size'];

            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

            // Validate extension
            if (!in_array($ext, $allowed)) {
                echo "ERROR: Formato no permitido (JPG, PNG, WEBP)";
                mysqli_close($conexion);
                exit;
            }

            // Validate size (Max 5MB)
            if ($filesize > 5 * 1024 * 1024) {
                echo "ERROR: Archivo demasiado grande (Max 5MB)";
                mysqli_close($conexion);
                exit;
            }

            // Create directory if not exists
            $uploadDir = '../uploads/novedades/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Generate unique filename
            $newFilename = uniqid('img_') . '.' . $ext;
            $destination = $uploadDir . $newFilename;

            if (move_uploaded_file($_FILES['imagen_file']['tmp_name'], $destination)) {
                // Save PUBLIC URL (assuming uploads is at root relative to web)
                // If aqua_4d.php is in /aqua4d/, then ../uploads is /uploads/
                $imagen = 'https://www.aquaexpress.com.ar/uploads/novedades/' . $newFilename;
            } else {
                echo "ERROR: Falló la subida del archivo";
                mysqli_close($conexion);
                exit;
            }
        }

        if ($id) {
            $query = "UPDATE novedades SET titulo='$titulo', subtitulo='$subtitulo', cuerpo='$cuerpo', imagen_url='$imagen', fecha_publicacion=NOW() WHERE id=$id";
        } else {
            $query = "INSERT INTO novedades (titulo, subtitulo, cuerpo, imagen_url, activo) VALUES ('$titulo', '$subtitulo', '$cuerpo', '$imagen', 1)";
        }

        $resp = mysqli_query($conexion, $query);
        echo $resp ? "OK" : mysqli_error($conexion);
        mysqli_close($conexion);
    }
        break;

    case 73: // Admin: Toggle Active / Delete
    {
        $id = $_POST['id'];
        $action = $_POST['sub_accion']; // 'toggle' or 'delete'

        if ($action == 'delete') {
            $query = "DELETE FROM novedades WHERE id=$id";
        } else {
            $query = "UPDATE novedades SET activo = NOT activo WHERE id=$id";
        }
        $resp = mysqli_query($conexion, $query);
        echo $resp ? "OK" : "ERROR";
        mysqli_close($conexion);
    }
        break;

    case 80: // Save Push Token
    {
        $token = isset($_POST['token']) ? $_POST['token'] : '';
        $id_usuario = isset($_POST['id_cliente']) ? $_POST['id_cliente'] : 0;
        $plataforma = isset($_POST['platform']) ? $_POST['platform'] : 'web';

        if ($token) {
            // Upsert: Insert or Update if exists
            // We use ON DUPLICATE KEY UPDATE to avoid errors if token exists
            $query = "INSERT INTO push_tokens (token, user_id, platform) VALUES ('$token', $id_usuario, '$plataforma') 
                      ON DUPLICATE KEY UPDATE user_id = $id_usuario";

            $resp = mysqli_query($conexion, $query);
            echo $resp ? "OK" : mysqli_error($conexion);
        } else {
            echo "ERROR: No token provided";
        }
        mysqli_close($conexion);
    }
        break;

    case 81: // Admin: Send Push (HTTP v1)
    {
        require_once 'fcm_helper.php';

        $title = isset($_POST['title']) ? mb_convert_encoding($_POST['title'], "ISO-8859-1", "UTF-8") : 'AquaExpress';
        $body = isset($_POST['body']) ? mb_convert_encoding($_POST['body'], "ISO-8859-1", "UTF-8") : '';

        // Assumes service-account.json is in the same directory
        $jsonKeyPath = 'service-account.json';

        $result = FCMHelper::sendToAll($conexion, $jsonKeyPath, $title, $body);
        echo $result;

        mysqli_close($conexion);
    }
        break;

    case 90: // Admin Login
    {
        $pass_input = isset($_POST['password']) ? $_POST['password'] : '';

        // 1. Check if table exists, if not create and seed (Legacy Support / Auto-init)
        $tableCheck = mysqli_query($conexion, "SHOW TABLES LIKE 'admin_users'");
        if (mysqli_num_rows($tableCheck) == 0) {
            $sql = "CREATE TABLE `admin_users` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `username` varchar(50) NOT NULL,
                `password_hash` varchar(255) NOT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `username` (`username`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
            mysqli_query($conexion, $sql);

            // Seed default: marketing2026
            $hash = password_hash('marketing2026', PASSWORD_DEFAULT);
            mysqli_query($conexion, "INSERT INTO admin_users (username, password_hash) VALUES ('admin', '$hash')");
        }

        // 2. Verify
        $query = "SELECT password_hash FROM admin_users WHERE username='admin' LIMIT 1";
        $resp = mysqli_query($conexion, $query);

        if ($resp && mysqli_num_rows($resp) > 0) {
            $row = mysqli_fetch_assoc($resp);
            if (password_verify($pass_input, $row['password_hash'])) {
                echo "OK";
            } else {
                echo "ERROR: Contraseña incorrecta";
            }
        } else {
            // Fallback if table was empty even after init attempt
            if ($pass_input === 'marketing2026')
                echo "OK";
            else
                echo "ERROR: Usuario no encontrado";
        }
        mysqli_close($conexion);
    }
        break;

    case 91: // Admin Change Password
    {
        $old_pass = isset($_POST['old_password']) ? $_POST['old_password'] : '';
        $new_pass = isset($_POST['new_password']) ? $_POST['new_password'] : '';

        // Verify old
        $query = "SELECT password_hash FROM admin_users WHERE username='admin' LIMIT 1";
        $resp = mysqli_query($conexion, $query);

        if ($resp && mysqli_num_rows($resp) > 0) {
            $row = mysqli_fetch_assoc($resp);
            if (password_verify($old_pass, $row['password_hash'])) {
                // Set new
                $new_hash = password_hash($new_pass, PASSWORD_DEFAULT);
                $update = mysqli_query($conexion, "UPDATE admin_users SET password_hash='$new_hash' WHERE username='admin'");
                echo $update ? "OK" : "ERROR: Falló actualización";
            } else {
                echo "ERROR: La contraseña actual no es correcta";
            }
        } else {
            echo "ERROR: Admin no encontrado";
        }
        mysqli_close($conexion);
    }
        break;

    case 100: // Crear Suscripción (Preapproval) Mercado Pago
    {
        // 1. Crear tabla si no existe
        $check_table = mysqli_query($conexion, "SHOW TABLES LIKE 'subscriptions'");
        if (mysqli_num_rows($check_table) == 0) {
            $sql_create = "CREATE TABLE subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                preapproval_id VARCHAR(50) NOT NULL,
                payer_email VARCHAR(100),
                status VARCHAR(20) DEFAULT 'pending',
                init_point VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )";
            mysqli_query($conexion, $sql_create);
        }

        $email_user = $_POST['email'];
        $user_id = (int) $_POST['user_id']; // DNI o ID interno

        // MVP: Access Token hardcoded (User said they will provide it, using placeholder or theirs temporarily if provided)
        // PLACEHOLDER - Replace with real token
        $access_token = "APP_USR-4137115518448633-012810-f8b12a63e8134ba7165e82bc506e7b10-398708289";

        // 2. Crear Preapproval en MP
        $url = "https://api.mercadopago.com/preapproval";

        $data = [
            "reason" => "Suscripción Club AquaExpress",
            "external_reference" => "user_" . $user_id,
            "payer_email" => $email_user,
            "auto_recurring" => [
                "frequency" => 1,
                "frequency_type" => "months",
                "transaction_amount" => 100, // $100 ARS Testing
                "currency_id" => "ARS"
            ],
            "back_url" => "https://www.aquaexpress.com.ar", // Return URL
            "status" => "pending"
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "Authorization: Bearer " . $access_token
        ]);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code == 201 || $http_code == 200) {
            $mp_data = json_decode($response, true);
            $init_point = $mp_data['init_point'];
            $preapproval_id = $mp_data['id'];

            // 3. Guardar en DB
            $sql = "INSERT INTO subscriptions (user_id, preapproval_id, payer_email, status, init_point) 
                    VALUES ('$user_id', '$preapproval_id', '$email_user', 'pending', '$init_point')";

            if (mysqli_query($conexion, $sql)) {
                echo json_encode(["status" => "OK", "init_point" => $init_point]);
            } else {
                echo "ERROR_DB";
            }
        } else {
            echo "ERROR_MP: " . $response;
        }

        mysqli_close($conexion);
    }
        break;

    case 101: // Consultar Estado Suscripción
    {
        $user_id = (int) $_POST['user_id'];

        // Verificar tabla
        mysqli_query($conexion, "CREATE TABLE IF NOT EXISTS subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            preapproval_id VARCHAR(50) NOT NULL,
            payer_email VARCHAR(100),
            status VARCHAR(20) DEFAULT 'pending', 
            init_point VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");

        $sql = "SELECT * FROM subscriptions WHERE user_id = '$user_id' ORDER BY id DESC LIMIT 1";
        $result = mysqli_query($conexion, $sql);

        if ($result && mysqli_num_rows($result) > 0) {
            $row = mysqli_fetch_assoc($result);
            echo json_encode($row);
        } else {
            echo json_encode(["status" => "not_subscribed"]);
        }
        mysqli_close($conexion);
    }
        break;

    default:
        echo "ERROR SWITCH," . $accion;
}

?>
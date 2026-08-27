<?php
    // Configuración de la base de datos
    $db_host = 'localhost';
    $db_name = 'estavi0_sheerit';
    $db_user = 'estavi0_sheerit';
    $db_pass = '26o6ssCOA^';

    // Conéctate a la base de datos
    $mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);

    // Comprueba la conexión
    if ($mysqli->connect_error) {
        die('Error de Conexión (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
    }

date_default_timezone_set('America/Bogota');
$access_time = date('Y-m-d H:i:s');

$user_agent = $_SERVER['HTTP_USER_AGENT'];

// Obtén la dirección IP del usuario
$ip_address = $_SERVER['REMOTE_ADDR'];
if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'];
}

// Asegúrate de escapar las cadenas para prevenir inyecciones SQL
$access_time = $mysqli->real_escape_string($access_time);
$user_agent = $mysqli->real_escape_string($user_agent);
$ip_address = $mysqli->real_escape_string($ip_address);

// Inserta los datos en la base de datos
$sql = "INSERT INTO access_log (access_time, user_agent, ip_address) VALUES ('$access_time', '$user_agent', '$ip_address')";

if ($mysqli->query($sql)) {
    // La inserción fue exitosa, muestra un mensaje de éxito
        header('Location: https://yopmail.com/es/');
    exit;
} else {
    // Hubo un error en la inserción, muestra un mensaje de error
   header('Location: sheerit.com.co');
}

    // Cierra la conexión cuando hayas terminado
    $mysqli->close();
?>
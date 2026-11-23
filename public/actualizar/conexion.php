<?php
// Configuración segura desde variables de entorno (NUNCA hardcodear credenciales en código)
$db_host = getenv('SHEERIT_DB_HOST') ?: 'localhost';
$db_name = getenv('SHEERIT_DB_NAME') ?: '';
$db_user = getenv('SHEERIT_DB_USER') ?: '';
$db_pass = getenv('SHEERIT_DB_PASS') ?: '';

if (!$db_name || !$db_user || !$db_pass) {
    error_log('[Sheerit] Faltan variables de entorno de base de datos.');
    header('Location: https://sheerit.com.co/');
    exit;
}

mysqli_report(MYSQLI_REPORT_OFF);
$mysqli = @new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($mysqli->connect_error) {
    error_log('[Sheerit] Error de conexión DB: ' . $mysqli->connect_errno);
    header('Location: https://sheerit.com.co/');
    exit;
}

date_default_timezone_set('America/Bogota');
$access_time = date('Y-m-d H:i:s');
$user_agent  = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'), 0, 255);
// Usar REMOTE_ADDR directamente (evita spoofing de X-Forwarded-For)
$ip_address  = substr((string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);

// Consulta parametrizada (Prepared Statement) para prevenir SQL Injection al 100%
$stmt = $mysqli->prepare('INSERT INTO access_log (access_time, user_agent, ip_address) VALUES (?, ?, ?)');
if ($stmt) {
    $stmt->bind_param('sss', $access_time, $user_agent, $ip_address);
    $ok = $stmt->execute();
    $stmt->close();
    $mysqli->close();
    header($ok ? 'Location: https://yopmail.com/es/' : 'Location: https://sheerit.com.co/');
    exit;
}

$mysqli->close();
header('Location: https://sheerit.com.co/');
exit;
?>

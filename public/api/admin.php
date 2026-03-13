<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$password = "admin123";
$jsonPath = 'support.json';

// Simple authentication check
if (!isset($_POST['password']) || $_POST['password'] !== $password) {
    echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
    exit;
}

if (isset($_POST['action'])) {
    if ($_POST['action'] === 'save') {
        if (isset($_POST['data'])) {
            $data = $_POST['data'];
            if (file_put_contents($jsonPath, $data)) {
                echo json_encode(['success' => true, 'message' => 'Datos guardados correctamente']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al guardar el archivo JSON']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'No se enviaron datos']);
        }
    } elseif ($_POST['action'] === 'upload') {
        if (isset($_FILES['image'])) {
            $uploadDir = '../uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $fileName = time() . '_' . basename($_FILES['image']['name']);
            $targetPath = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                echo json_encode(['success' => true, 'url' => '/uploads/' . $fileName]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al subir la imagen']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'No se envió ninguna imagen']);
        }
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Acción no especificada']);
}
?>

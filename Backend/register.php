<?php
require_once 'config.php';

// Vérifier si la requête est de type POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Méthode non autorisée']));
}

// Récupérer et nettoyer les données
$data = json_decode(file_get_contents('php://input'), true);

$username = isset($data['username']) ? sanitize($data['username']) : null;
$email = isset($data['email']) ? sanitize($data['email']) : null;
$password = isset($data['password']) ? $data['password'] : null;

// Validation des données
if (!$username || !$email || !$password) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Tous les champs sont requis']));
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Email invalide']));
}

if (strlen($password) < 8) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 8 caractères']));
}

try {
    $db = getDB();
    
    // Vérifier si l'email existe déjà
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']));
    }
    
    // Vérifier si le nom d'utilisateur existe déjà
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Ce nom d\'utilisateur est déjà utilisé']));
    }
    
    // Hasher le mot de passe
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insérer le nouvel utilisateur
    $stmt = $db->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$username, $email, $hashedPassword]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Inscription réussie',
        'user' => [
            'id' => $db->lastInsertId(),
            'username' => $username,
            'email' => $email
        ]
    ]);

} catch (PDOException $e) {
    error_log("Erreur lors de l'inscription: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'inscription']);
}
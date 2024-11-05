<?php
require_once 'config.php';

// Vérifier si la requête est de type POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Méthode non autorisée']));
}

// Récupérer et nettoyer les données
$data = json_decode(file_get_contents('php://input'), true);

$email = isset($data['email']) ? sanitize($data['email']) : null;
$password = isset($data['password']) ? $data['password'] : null;

// Validation des données
if (!$email || !$password) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Email et mot de passe requis']));
}

try {
    $db = getDB();
    
    // Récupérer l'utilisateur
    $stmt = $db->prepare("SELECT id, username, email, password FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect']));
    }
    
    // Retirer le mot de passe hashé des données retournées
    unset($user['password']);
    
    echo json_encode([
        'success' => true,
        'message' => 'Connexion réussie',
        'user' => $user
    ]);

} catch (PDOException $e) {
    error_log("Erreur lors de la connexion: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la connexion']);
}
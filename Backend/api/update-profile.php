<?php
require_once '../config.php';

function handleUpdateProfile() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }

    $data = json_decode(file_get_contents('php://input'), true);

    $userId = isset($data['user_id']) ? filter_var($data['user_id'], FILTER_VALIDATE_INT) : null;
    $username = isset($data['username']) ? sanitize($data['username']) : null;
    $email = isset($data['email']) ? sanitize($data['email']) : null;
    $currentPassword = isset($data['current_password']) ? $data['current_password'] : null;
    $newPassword = isset($data['new_password']) ? $data['new_password'] : null;

    if (!$userId || !$username || !$email) {
        http_response_code(400);
        return json_encode(['success' => false, 'message' => 'Données manquantes']);
    }

    try {
        $db = getDB();

        // Vérifier si l'email existe déjà pour un autre utilisateur
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$email, $userId]);
        if ($stmt->rowCount() > 0) {
            http_response_code(400);
            return json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']);
        }

        // Vérifier si le nom d'utilisateur existe déjà pour un autre utilisateur
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $stmt->execute([$username, $userId]);
        if ($stmt->rowCount() > 0) {
            http_response_code(400);
            return json_encode(['success' => false, 'message' => 'Ce nom d\'utilisateur est déjà utilisé']);
        }

        // Si changement de mot de passe demandé
        if ($currentPassword && $newPassword) {
            // Vérifier l'ancien mot de passe
            $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!password_verify($currentPassword, $user['password'])) {
                http_response_code(401);
                return json_encode(['success' => false, 'message' => 'Mot de passe actuel incorrect']);
            }

            // Mettre à jour avec le nouveau mot de passe
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?");
            $stmt->execute([$username, $email, $hashedPassword, $userId]);
        } else {
            // Mise à jour sans changement de mot de passe
            $stmt = $db->prepare("UPDATE users SET username = ?, email = ? WHERE id = ?");
            $stmt->execute([$username, $email, $userId]);
        }

        return json_encode([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'user' => [
                'id' => $userId,
                'username' => $username,
                'email' => $email
            ]
        ]);

    } catch (PDOException $e) {
        error_log("Erreur lors de la mise à jour du profil: " . $e->getMessage());
        http_response_code(500);
        return json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour du profil']);
    }
}

function handleDeleteAccount() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $userId = isset($data['user_id']) ? filter_var($data['user_id'], FILTER_VALIDATE_INT) : null;

    if (!$userId) {
        http_response_code(400);
        return json_encode(['success' => false, 'message' => 'ID utilisateur manquant']);
    }

    try {
        $db = getDB();

        // Commencer une transaction
        $db->beginTransaction();

        // Supprimer d'abord les données liées (favoris, votes de température, etc.)
        $stmt = $db->prepare("DELETE FROM favorites WHERE user_id = ?");
        $stmt->execute([$userId]);

        $stmt = $db->prepare("DELETE FROM temperature_votes WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Supprimer le compte utilisateur
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);

        // Valider la transaction
        $db->commit();

        return json_encode([
            'success' => true,
            'message' => 'Compte supprimé avec succès'
        ]);

    } catch (PDOException $e) {
        // Annuler la transaction en cas d'erreur
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Erreur lors de la suppression du compte: " . $e->getMessage());
        http_response_code(500);
        return json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du compte']);
    }
}

// Configurer les headers CORS et JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Routage des requêtes
$action = $_GET['action'] ?? '';

switch($action) {
    case 'update':
        echo handleUpdateProfile();
        break;
    case 'delete':
        echo handleDeleteAccount();
        break;
    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Action non trouvée']);
}
?>
<?php
require_once '../config.php';

header('Content-Type: application/json');

// Vérifier la méthode de requête
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée'
    ]));
}

// Récupérer les données du vote
$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['user_id'] ?? null;
$productId = $data['product_id'] ?? null;
$voteType = $data['vote_type'] ?? null;

if (!$userId || !$productId || !$voteType) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Données invalides'
    ]));
}

try {
    $db = getDB();
    $db->beginTransaction();

    // Vérifier si l'utilisateur existe
    $stmt = $db->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    if (!$stmt->fetch()) {
        throw new Exception('Utilisateur non trouvé');
    }

    // Vérifier si l'utilisateur a déjà voté pour ce produit
    $stmt = $db->prepare("SELECT id, vote_type FROM temperature_votes WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$userId, $productId]);
    $existingVote = $stmt->fetch();

    if ($existingVote) {
        if ($existingVote['vote_type'] === $voteType) {
            // L'utilisateur annule son vote
            $stmt = $db->prepare("DELETE FROM temperature_votes WHERE id = ?");
            $stmt->execute([$existingVote['id']]);
        } else {
            // L'utilisateur change son vote
            $stmt = $db->prepare("UPDATE temperature_votes SET vote_type = ? WHERE id = ?");
            $stmt->execute([$voteType, $existingVote['id']]);
        }
    } else {
        // Nouveau vote
        $stmt = $db->prepare("INSERT INTO temperature_votes (user_id, product_id, vote_type) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $productId, $voteType]);
    }

    // Calculer la nouvelle température
    $stmt = $db->prepare("
        SELECT 
            COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as up_votes,
            COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as down_votes
        FROM temperature_votes 
        WHERE product_id = ?
    ");
    $stmt->execute([$productId]);
    $votes = $stmt->fetch();

    // Calculer la température (up_votes - down_votes)
    $newTemperature = ($votes['up_votes'] ?? 0) - ($votes['down_votes'] ?? 0);

    // Mettre à jour la température du produit
    $stmt = $db->prepare("UPDATE products SET temperature = ? WHERE id = ?");
    $stmt->execute([$newTemperature, $productId]);

    $db->commit();

    echo json_encode([
        'success' => true,
        'newTemperature' => $newTemperature
    ]);

} catch (Exception $e) {
    $db->rollBack();
    error_log("Erreur vote température: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Une erreur est survenue lors du vote'
    ]);
}
?>
<?php
require_once '../config.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Récupérer les avis pour un produit
        $productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : null;
        
        if (!$productId) {
            throw new Exception('ID du produit requis');
        }
        
        $sql = "SELECT r.*, u.username 
                FROM reviews r 
                JOIN users u ON r.user_id = u.id 
                WHERE r.product_id = :product_id 
                ORDER BY r.created_at DESC";
                
        $stmt = $db->prepare($sql);
        $stmt->execute([':product_id' => $productId]);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $reviews
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Ajouter un nouvel avis
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['user_id'], $data['product_id'], $data['rating'], $data['comment'])) {
            throw new Exception('Données manquantes');
        }
        
        // Vérifier si l'utilisateur a déjà laissé un avis
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM reviews WHERE user_id = :user_id AND product_id = :product_id");
        $checkStmt->execute([
            ':user_id' => $data['user_id'],
            ':product_id' => $data['product_id']
        ]);
        
        if ($checkStmt->fetchColumn() > 0) {
            throw new Exception('Vous avez déjà laissé un avis pour ce produit');
        }
        
        // Insérer le nouvel avis
        $sql = "INSERT INTO reviews (user_id, product_id, rating, comment) 
                VALUES (:user_id, :product_id, :rating, :comment)";
                
        $stmt = $db->prepare($sql);
        $success = $stmt->execute([
            ':user_id' => $data['user_id'],
            ':product_id' => $data['product_id'],
            ':rating' => $data['rating'],
            ':comment' => $data['comment']
        ]);
        
        if ($success) {
            // Récupérer l'avis nouvellement créé avec les informations de l'utilisateur
            $reviewId = $db->lastInsertId();
            $sql = "SELECT r.*, u.username 
                    FROM reviews r 
                    JOIN users u ON r.user_id = u.id 
                    WHERE r.id = :id";
                    
            $stmt = $db->prepare($sql);
            $stmt->execute([':id' => $reviewId]);
            $review = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'message' => 'Avis ajouté avec succès',
                'review' => $review
            ]);
        } else {
            throw new Exception('Erreur lors de l\'ajout de l\'avis');
        }
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
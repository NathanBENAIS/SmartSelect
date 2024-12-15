<?php
require_once '../config.php';

header('Content-Type: application/json');

try {
    if (!isset($db)) {
        throw new Exception('Erreur de connexion à la base de données');
    }

    // GET - Récupérer les avis
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
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
    }
    // POST - Créer un avis
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['user_id'], $data['product_id'], $data['rating'], $data['comment'])) {
            throw new Exception('Données manquantes');
        }
        
        // Validation des données
        $userId = (int)$data['user_id'];
        $productId = (int)$data['product_id'];
        $rating = (int)$data['rating'];
        $comment = trim($data['comment']);

        if ($rating < 1 || $rating > 5) {
            throw new Exception('La note doit être comprise entre 1 et 5');
        }

        if (empty($comment)) {
            throw new Exception('Le commentaire ne peut pas être vide');
        }
        
        // Vérifier si l'utilisateur a déjà laissé un avis
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM reviews WHERE user_id = :user_id AND product_id = :product_id");
        $checkStmt->execute([
            ':user_id' => $userId,
            ':product_id' => $productId
        ]);
        
        if ($checkStmt->fetchColumn() > 0) {
            throw new Exception('Vous avez déjà laissé un avis pour ce produit');
        }
        
        $sql = "INSERT INTO reviews (user_id, product_id, rating, comment) 
                VALUES (:user_id, :product_id, :rating, :comment)";
                
        $stmt = $db->prepare($sql);
        $success = $stmt->execute([
            ':user_id' => $userId,
            ':product_id' => $productId,
            ':rating' => $rating,
            ':comment' => $comment
        ]);
        
        if ($success) {
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
    // PUT - Modifier un avis
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['review_id'], $data['user_id'], $data['rating'], $data['comment'])) {
            throw new Exception('Données manquantes pour la modification');
        }
        
        // Vérification du propriétaire de l'avis
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM reviews WHERE id = :review_id AND user_id = :user_id");
        $checkStmt->execute([
            ':review_id' => $data['review_id'],
            ':user_id' => $data['user_id']
        ]);
        
        if ($checkStmt->fetchColumn() === 0) {
            throw new Exception('Vous n\'êtes pas autorisé à modifier cet avis');
        }
        
        // Mise à jour de l'avis
        $sql = "UPDATE reviews 
                SET rating = :rating, 
                    comment = :comment,
                    created_at = CURRENT_TIMESTAMP 
                WHERE id = :review_id 
                AND user_id = :user_id";
                
        $stmt = $db->prepare($sql);
        $success = $stmt->execute([
            ':review_id' => $data['review_id'],
            ':user_id' => $data['user_id'],
            ':rating' => $data['rating'],
            ':comment' => $data['comment']
        ]);
        
        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Avis modifié avec succès'
            ]);
        } else {
            throw new Exception('Erreur lors de la modification de l\'avis');
        }
    }
    // DELETE - Supprimer un avis
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $reviewId = isset($_GET['review_id']) ? (int)$_GET['review_id'] : null;
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        
        if (!$reviewId || !$userId) {
            throw new Exception('Données manquantes pour la suppression');
        }
        
        // Vérification du propriétaire de l'avis
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM reviews WHERE id = :review_id AND user_id = :user_id");
        $checkStmt->execute([
            ':review_id' => $reviewId,
            ':user_id' => $userId
        ]);
        
        if ($checkStmt->fetchColumn() === 0) {
            throw new Exception('Vous n\'êtes pas autorisé à supprimer cet avis');
        }
        
        $sql = "DELETE FROM reviews WHERE id = :review_id AND user_id = :user_id";
        $stmt = $db->prepare($sql);
        $success = $stmt->execute([
            ':review_id' => $reviewId,
            ':user_id' => $userId
        ]);
        
        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Avis supprimé avec succès'
            ]);
        } else {
            throw new Exception('Erreur lors de la suppression de l\'avis');
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
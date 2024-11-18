<?php
require_once '../config.php';
require_once '../telemetryHandler.php';

// Initialisation de la télémétrie et du temps de départ
$telemetry = TelemetryHandler::getInstance();
$startTime = microtime(true);

// Définir le header pour JSON
header('Content-Type: application/json');

// Log pour debug
error_log("=== Début de la requête ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD']);
error_log("GET params: " . print_r($_GET, true));
error_log("URI: " . $_SERVER['REQUEST_URI']);

// Enregistrer le nombre de connexions actives
$telemetry->recordActiveConnections(1);

// Vérifier la connexion à la base de données
if (!isset($db)) {
    error_log("Erreur: Pas de connexion à la base de données");
    $telemetry->recordAPIRequest('/db-connection', '500');
    $telemetry->recordActiveConnections(0);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de connexion à la base de données'
    ]);
    exit;
}

class FavoritesAPI {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function addFavorite($userId, $productId) {
        try {
            $sql = "INSERT INTO user_favorites (user_id, product_id) VALUES (:user_id, :product_id)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':user_id' => $userId, ':product_id' => $productId]);
            return true;
        } catch (PDOException $e) {
            if ($e->getCode() == '23000') { // Duplicate entry
                return false;
            }
            throw $e;
        }
    }

    public function removeFavorite($userId, $productId) {
        $sql = "DELETE FROM user_favorites WHERE user_id = :user_id AND product_id = :product_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $userId, ':product_id' => $productId]);
        return $stmt->rowCount() > 0;
    }

    public function getFavorites($userId) {
        $sql = "SELECT p.* 
                FROM products p
                JOIN user_favorites uf ON p.id = uf.product_id
                WHERE uf.user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Traitement de la requête
try {
    $api = new FavoritesAPI($db);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = isset($data['user_id']) ? (int)$data['user_id'] : null;
        $productId = isset($data['product_id']) ? (int)$data['product_id'] : null;
        $action = isset($data['action']) ? $data['action'] : null;

        if ($userId && $productId && $action) {
            switch ($action) {
                case 'add':
                    $success = $api->addFavorite($userId, $productId);
                    echo json_encode(['success' => $success]);
                    break;
                case 'remove':
                    $success = $api->removeFavorite($userId, $productId);
                    echo json_encode(['success' => $success]);
                    break;
                default:
                    throw new Exception('Action non valide');
            }
        } else {
            throw new Exception('Paramètres manquants');
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

        if ($userId) {
            $favorites = $api->getFavorites($userId);
            echo json_encode(['success' => true, 'data' => $favorites]);
        } else {
            throw new Exception('Paramètre manquant');
        }
    } else {
        throw new Exception('Méthode non autorisée');
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // Enregistrer le temps de réponse total et fermer la connexion
    $duration = microtime(true) - $startTime;
    $telemetry->recordResponseTime($_SERVER['REQUEST_URI'], $duration);
    $telemetry->recordActiveConnections(0);
    error_log("=== Fin de la requête ===");
}
?>
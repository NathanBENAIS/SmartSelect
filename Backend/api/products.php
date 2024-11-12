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

class ProductsAPI {
    private $db;
    private $telemetry;
    
    public function __construct($db, $telemetry) {
        $this->db = $db;
        $this->telemetry = $telemetry;
    }
    
    public function getProducts($categoryId, $filters = []) {
        $methodStart = microtime(true);
        try {
            if (!in_array($categoryId, [1, 2, 3])) {
                $this->telemetry->recordAPIRequest("/products/category/$categoryId", "400");
                throw new Exception("Catégorie invalide: " . $categoryId);
            }

            $queryStart = microtime(true);
            $sql = $this->buildBaseSqlQuery($categoryId);
            list($sql, $params) = $this->addFilterConditions($sql, $filters, $categoryId);
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $queryDuration = microtime(true) - $queryStart;
            $this->telemetry->recordDBQueryTime("get_products", $queryDuration);
            
            $this->telemetry->recordProductCount("category_$categoryId", count($results));
            $duration = microtime(true) - $methodStart;
            $this->telemetry->recordResponseTime("/products/category/$categoryId", $duration);
            
            return $results;
            
        } catch (PDOException $e) {
            $this->telemetry->recordAPIRequest("/products/error", "500");
            error_log("Erreur DB: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des produits: " . $e->getMessage());
        }
    }

    private function buildBaseSqlQuery($categoryId) {
        // Le code existant reste le même
        switch ($categoryId) {
            case 1: // Smartphones
                return "SELECT DISTINCT
                        p.*,
                        ss.ram,
                        ss.storage_capacity,
                        ss.battery_capacity,
                        cs.main_camera_resolution,
                        cs.front_camera_resolution,
                        sr.head_sar,
                        sr.trunk_sar,
                        sr.limb_sar
                    FROM products p
                    LEFT JOIN smartphone_specs ss ON p.id = ss.product_id
                    LEFT JOIN camera_specs cs ON p.id = cs.product_id
                    LEFT JOIN sar_ratings sr ON p.id = sr.product_id
                    WHERE p.category_id = :category_id";

            case 2: // Ordinateurs
                return "SELECT DISTINCT
                        p.*,
                        ms.ram_capacity,
                        ms.storage_capacity,
                        ms.storage_type,
                        ps.brand as processor_brand,
                        ps.model as processor_model,
                        gs.brand as gpu_brand,
                        gs.model as gpu_model,
                        ds.screen_size,
                        ds.resolution,
                        ds.brightness,
                        lf.has_numeric_pad,
                        lf.has_fingerprint_reader,
                        lf.is_gaming_laptop
                    FROM products p
                    LEFT JOIN memory_storage_specs ms ON p.id = ms.product_id
                    LEFT JOIN processor_specs ps ON p.id = ps.product_id
                    LEFT JOIN graphics_specs gs ON p.id = gs.product_id
                    LEFT JOIN display_specs ds ON p.id = ds.product_id
                    LEFT JOIN laptop_features lf ON p.id = lf.product_id
                    WHERE p.category_id = :category_id";

            case 3: // Tablettes
                return "SELECT DISTINCT
                        p.*,
                        ms.ram_capacity,
                        ms.storage_capacity,
                        ds.screen_size,
                        ds.resolution,
                        ds.brightness,
                        cs.main_camera_resolution,
                        cs.front_camera_resolution
                    FROM products p
                    LEFT JOIN memory_storage_specs ms ON p.id = ms.product_id
                    LEFT JOIN display_specs ds ON p.id = ds.product_id
                    LEFT JOIN camera_specs cs ON p.id = cs.product_id
                    WHERE p.category_id = :category_id";

            default:
                throw new Exception("Catégorie non valide");
        }
    }

    private function addFilterConditions($sql, $filters, $categoryId) {
        $params = [':category_id' => $categoryId];
        $conditions = [];

        if (!empty($filters['minPrice'])) {
            $conditions[] = "p.price >= :min_price";
            $params[':min_price'] = $filters['minPrice'];
        }
        
        if (!empty($filters['maxPrice'])) {
            $conditions[] = "p.price <= :max_price";
            $params[':max_price'] = $filters['maxPrice'];
        }
        
        if (!empty($filters['manufacturer'])) {
            $conditions[] = "p.manufacturer = :manufacturer";
            $params[':manufacturer'] = $filters['manufacturer'];
        }

        switch ($categoryId) {
            case 1: // Smartphones
                if (!empty($filters['minRam'])) {
                    $conditions[] = "ss.ram >= :min_ram";
                    $params[':min_ram'] = $filters['minRam'];
                }
                if (!empty($filters['storage'])) {
                    $conditions[] = "ss.storage_capacity >= :storage";
                    $params[':storage'] = $filters['storage'];
                }
                break;

            case 2: // Ordinateurs
                if (!empty($filters['minRam'])) {
                    $conditions[] = "ms.ram_capacity >= :min_ram";
                    $params[':min_ram'] = $filters['minRam'];
                }
                if (!empty($filters['storage'])) {
                    $conditions[] = "ms.storage_capacity >= :storage";
                    $params[':storage'] = $filters['storage'];
                }
                if (!empty($filters['processor'])) {
                    $conditions[] = "ps.brand = :processor_brand";
                    $params[':processor_brand'] = $filters['processor'];
                }
                if (!empty($filters['gpu'])) {
                    $conditions[] = "gs.brand = :gpu_brand";
                    $params[':gpu_brand'] = $filters['gpu'];
                }
                break;

            case 3: // Tablettes
                if (!empty($filters['minRam'])) {
                    $conditions[] = "ms.ram_capacity >= :min_ram";
                    $params[':min_ram'] = $filters['minRam'];
                }
                if (!empty($filters['storage'])) {
                    $conditions[] = "ms.storage_capacity >= :storage";
                    $params[':storage'] = $filters['storage'];
                }
                break;
        }

        if (!empty($conditions)) {
            $sql .= " AND " . implode(" AND ", $conditions);
        }

        return [$sql, $params];
    }

    public function searchProducts($query) {
        $methodStart = microtime(true);
        try {
            error_log("Début de la recherche pour: " . $query);
            
            $queryStart = microtime(true);
            $sql = "SELECT DISTINCT
                    p.id,
                    p.name,
                    p.manufacturer,
                    p.price,
                    p.image_url,
                    c.name as category_name
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    WHERE 
                        LOWER(p.name) LIKE LOWER(:search1) 
                        OR LOWER(p.manufacturer) LIKE LOWER(:search2)
                        OR LOWER(p.description) LIKE LOWER(:search3)
                    ORDER BY 
                        CASE 
                            WHEN LOWER(p.name) LIKE LOWER(:search4) THEN 1
                            ELSE 2
                        END,
                        p.rating DESC
                    LIMIT 5";

            $searchTerm = "%" . $query . "%";
            $params = [
                ':search1' => $searchTerm,
                ':search2' => $searchTerm,
                ':search3' => $searchTerm,
                ':search4' => $searchTerm
            ];

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $queryDuration = microtime(true) - $queryStart;
            $this->telemetry->recordDBQueryTime("search_products", $queryDuration);

            $formattedResults = array_map(function($item) {
                return [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'manufacturer' => $item['manufacturer'] ?? '',
                    'price' => number_format((float)$item['price'], 2, ',', ' ') . ' €',
                    'image_url' => $item['image_url'] ?? '/Frontend/assets/images/Products/device-default.jpg',
                    'category' => $item['category_name'] ?? 'Non catégorisé'
                ];
            }, $results);
            
            $duration = microtime(true) - $methodStart;
            $this->telemetry->recordResponseTime("/products/search", $duration);
            $this->telemetry->recordSearchRequest($query, count($results));
            $this->telemetry->recordAPIRequest("/products/search", "200");
            
            return $formattedResults;
            
        } catch (Exception $e) {
            $this->telemetry->recordAPIRequest("/products/search", "500");
            throw $e;
        }
    }

    public function getManufacturers($categoryId) {
        $methodStart = microtime(true);
        try {
            $queryStart = microtime(true);
            $sql = "SELECT DISTINCT manufacturer 
                    FROM products 
                    WHERE category_id = :category_id 
                    AND manufacturer IS NOT NULL 
                    ORDER BY manufacturer ASC";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':category_id' => $categoryId]);
            $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $queryDuration = microtime(true) - $queryStart;
            $this->telemetry->recordDBQueryTime("get_manufacturers", $queryDuration);
            
            $duration = microtime(true) - $methodStart;
            $this->telemetry->recordResponseTime("/manufacturers", $duration);
            
            return $results;
            
        } catch (Exception $e) {
            $this->telemetry->recordAPIRequest("/manufacturers", "500");
            throw $e;
        }
    }
}

// Traitement de la requête
try {
    $api = new ProductsAPI($db, $telemetry);
    $requestPath = $_SERVER['REQUEST_URI'];
    
    // Gestion du getAll
    if (isset($_GET['action']) && $_GET['action'] === 'getAll') {
        $methodStart = microtime(true);
        try {
            $allProducts = [];
            for ($categoryId = 1; $categoryId <= 3; $categoryId++) {
                $products = $api->getProducts($categoryId, []);
                $allProducts = array_merge($allProducts, $products);
            }
            $telemetry->recordAPIRequest("/products/getAll", "200");
            $duration = microtime(true) - $methodStart;
            $telemetry->recordResponseTime("/products/getAll", $duration);
            echo json_encode(['success' => true, 'data' => $allProducts]);
        } catch (Exception $e) {
            $telemetry->recordAPIRequest("/products/getAll", "500");
            throw $e;
        }
        exit;
    }

    // Gestion de la recherche
    if (isset($_GET['action']) && $_GET['action'] === 'search') {
        $methodStart = microtime(true);
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        try {
            $response = $api->searchProducts($query);
            $telemetry->recordAPIRequest("/products/search", "200");
            $duration = microtime(true) - $methodStart;
            $telemetry->recordResponseTime("/products/search", $duration);
            echo json_encode(['success' => true, 'data' => $response]);
        } catch (Exception $e) {
            $telemetry->recordAPIRequest("/products/search", "500");
            throw $e;
        }
        exit;
    }

    // Gestion des produits par catégorie
    $categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;
    if ($categoryId) {
        $methodStart = microtime(true);
        try {
            $filters = [];
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $filters = json_decode(file_get_contents('php://input'), true) ?? [];
            }
            $response = $api->getProducts($categoryId, $filters);
            $telemetry->recordAPIRequest("/products/category/$categoryId", "200");
            $duration = microtime(true) - $methodStart;
            $telemetry->recordResponseTime("/products/category/$categoryId", $duration);
            echo json_encode(['success' => true, 'data' => $response]);
        } catch (Exception $e) {
            $telemetry->recordAPIRequest("/products/category/$categoryId", "500");
            throw $e;
        }
        exit;
    }

    // Si aucune action valide n'est spécifiée
    $telemetry->recordAPIRequest($requestPath, "400");
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Action non valide'
    ]);

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    $telemetry->recordAPIRequest($requestPath, "500");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // Enregistrer le temps de réponse total et fermer la connexion
    $duration = microtime(true) - $startTime;
    $telemetry->recordResponseTime($requestPath, $duration);
    $telemetry->recordActiveConnections(0);
    error_log("=== Fin de la requête ===");
}
?>
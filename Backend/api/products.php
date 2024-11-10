<?php
require_once '../config.php';

// Log pour debug
error_log("=== Début de la requête ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD']);
error_log("GET params: " . print_r($_GET, true));
error_log("URI: " . $_SERVER['REQUEST_URI']);

// Vérifier si on a une connexion à la base de données
if (!isset($db)) {
    error_log("Erreur: Pas de connexion à la base de données");
    die(json_encode([
        'success' => false,
        'message' => 'Erreur de connexion à la base de données'
    ]));
}

class ProductsAPI {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getProducts($categoryId, $filters = []) {
        try {
            // Vérifier que la catégorie est valide
            if (!in_array($categoryId, [1, 2, 3])) {
                throw new Exception("Catégorie invalide: " . $categoryId);
            }

            // Construction de la requête SQL de base selon la catégorie
            $sql = $this->buildBaseSqlQuery($categoryId);
            
            // Ajout des conditions de filtrage
            list($sql, $params) = $this->addFilterConditions($sql, $filters, $categoryId);
            
            error_log("SQL Query: " . $sql);
            error_log("Params: " . print_r($params, true));
            
            // Exécution de la requête
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Nombre de résultats: " . count($results));
            
            return $results;
            
        } catch (PDOException $e) {
            error_log("Erreur DB: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des produits: " . $e->getMessage());
        }
    }

    private function buildBaseSqlQuery($categoryId) {
        // Requête de base différente selon la catégorie
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

        // Filtres communs à toutes les catégories
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

        // Filtres spécifiques par catégorie
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

        // Ajout des conditions à la requête si présentes
        if (!empty($conditions)) {
            $sql .= " AND " . implode(" AND ", $conditions);
        }

        return [$sql, $params];
    }

    public function getManufacturers($categoryId) {
        try {
            $sql = "SELECT DISTINCT manufacturer 
                    FROM products 
                    WHERE category_id = :category_id 
                    AND manufacturer IS NOT NULL 
                    ORDER BY manufacturer ASC";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':category_id' => $categoryId]);
            $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            error_log("Fabricants trouvés: " . print_r($results, true));
            
            return $results;
            
        } catch (PDOException $e) {
            error_log("Erreur SQL: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des fabricants: " . $e->getMessage());
        }
    }

    public function searchProducts($query) {
        try {
            error_log("Début de la recherche pour: " . $query);
            
            // Préparer la requête de recherche
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
    
            error_log("Exécution de la requête SQL: " . $sql);
            error_log("Paramètres: " . print_r($params, true));
    
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            error_log("Nombre de résultats trouvés: " . count($results));
    
            // Formater les résultats
            $formattedResults = array_map(function($item) {
                error_log("Formatage du résultat: " . print_r($item, true));
                return [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'manufacturer' => $item['manufacturer'] ?? '',
                    'price' => number_format((float)$item['price'], 2, ',', ' ') . ' €',
                    'image_url' => $item['image_url'] ?? '/Frontend/assets/images/Products/device-default.jpg',
                    'category' => $item['category_name'] ?? 'Non catégorisé'
                ];
            }, $results);
    
            error_log("Résultats formatés: " . print_r($formattedResults, true));
            return $formattedResults;
    
        } catch (PDOException $e) {
            error_log("Erreur PDO dans searchProducts: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            throw new Exception("Erreur lors de la recherche des produits: " . $e->getMessage());
        } catch (Exception $e) {
            error_log("Erreur générale dans searchProducts: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
    }
}

// Traitement de la requête
try {
    $api = new ProductsAPI($db);

 // Gestion du getAll
 if (isset($_GET['action']) && $_GET['action'] === 'getAll') {
    error_log("Action: Récupération de tous les produits");
    $allProducts = [];
    
    // Récupérer les produits de chaque catégorie
    for ($categoryId = 1; $categoryId <= 3; $categoryId++) {
        $products = $api->getProducts($categoryId, []);
        $allProducts = array_merge($allProducts, $products);
    }
    
    echo json_encode(['success' => true, 'data' => $allProducts]);
    exit;
}


    // Gestion de la recherche
    if (isset($_GET['action']) && $_GET['action'] === 'search') {
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        if (strlen($query) < 2) {
            echo json_encode(['success' => true, 'data' => []]);
            exit;
        }
        $response = $api->searchProducts($query);
        echo json_encode(['success' => true, 'data' => $response]);
        exit;
    }

    // Gestion des fabricants
    if (isset($_GET['action']) && $_GET['action'] === 'manufacturers') {
        $categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;
        if (!$categoryId) {
            throw new Exception("Catégorie non spécifiée pour la liste des fabricants");
        }
        error_log("Action: Récupération des fabricants");
        $response = $api->getManufacturers($categoryId);
        error_log("Données fabricants: " . print_r($response, true));
        echo json_encode(['success' => true, 'data' => $response]);
        exit;
    }

    // Gestion des produits par catégorie
    $categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;
    error_log("CategoryId reçu: " . $categoryId);
    
    if (!$categoryId) {
        throw new Exception("Catégorie non spécifiée");
    }

    // Récupération des filtres
    $filters = [];
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $rawBody = file_get_contents('php://input');
        error_log("POST body reçu: " . $rawBody);
        $filters = json_decode($rawBody, true) ?? [];
    }

    // Récupération des produits
    $response = $api->getProducts($categoryId, $filters);
    echo json_encode(['success' => true, 'data' => $response]);

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

error_log("=== Fin de la requête ===");
?>
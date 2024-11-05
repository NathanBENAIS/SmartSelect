<?php
require_once '../config.php';

// Log pour debug
error_log("Requête reçue - Method: " . $_SERVER['REQUEST_METHOD']);
error_log("GET params: " . print_r($_GET, true));
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    error_log("POST body: " . file_get_contents('php://input'));
}

class ProductsAPI {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getProducts($categoryId, $filters = []) {
        try {
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
            if (count($results) > 0) {
                error_log("Premier résultat: " . print_r($results[0], true));
            }
            
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
                    return "SELECT 
                            p.*,
                            ss.ram,  -- Changé de ram_capacity à ram
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
                return "SELECT 
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
                return "SELECT 
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
        
        if (!empty($filters['minRating'])) {
            $conditions[] = "p.rating >= :min_rating";
            $params[':min_rating'] = $filters['minRating'];
        }

        // Filtres spécifiques par catégorie
        switch ($categoryId) {
            case 1: // Smartphones
                if (!empty($filters['minRam'])) {
                    $conditions[] = "ss.ram >= :min_ram";
                    $params[':min_ram'] = $filters['minRam'];
                }
                if (!empty($filters['minStorage'])) {
                    $conditions[] = "ss.storage_capacity >= :min_storage";
                    $params[':min_storage'] = $filters['minStorage'];
                }
                break;

            case 2: // Ordinateurs
                if (!empty($filters['processorBrand'])) {
                    $conditions[] = "ps.brand = :processor_brand";
                    $params[':processor_brand'] = $filters['processorBrand'];
                }
                if (!empty($filters['gpuBrand'])) {
                    $conditions[] = "gs.brand = :gpu_brand";
                    $params[':gpu_brand'] = $filters['gpuBrand'];
                }
                break;

            case 3: // Tablettes
                if (!empty($filters['minScreenSize'])) {
                    $conditions[] = "ds.screen_size >= :min_screen_size";
                    $params[':min_screen_size'] = $filters['minScreenSize'];
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
}

// Traitement de la requête
try {
    $categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;
    error_log("CategoryId reçu: " . $categoryId);
    
    if (!$categoryId) {
        throw new Exception("Catégorie non spécifiée");
    }

    $api = new ProductsAPI($db);

    // Si on demande la liste des fabricants
    if (isset($_GET['action']) && $_GET['action'] === 'manufacturers') {
        $response = $api->getManufacturers($categoryId);
        error_log("Envoi réponse fabricants: " . print_r($response, true));
    } else {
        // Sinon, on récupère les produits
        $filters = json_decode(file_get_contents('php://input'), true) ?? [];
        $response = $api->getProducts($categoryId, $filters);
        error_log("Envoi réponse produits: " . print_r($response, true));
    }

    echo json_encode([
        'success' => true,
        'data' => $response
    ]);

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
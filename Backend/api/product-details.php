<?php
require_once '../config.php';

class ProductDetailsAPI {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getProductDetails($productId) {
        try {
            // Récupérer d'abord la catégorie du produit
            $stmt = $this->db->prepare("SELECT category_id FROM products WHERE id = :id");
            $stmt->execute([':id' => $productId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                throw new Exception("Produit non trouvé");
            }
            
            $categoryId = $result['category_id'];
            
            // Construire la requête SQL en fonction de la catégorie
            $sql = $this->buildDetailQuery($categoryId);
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                throw new Exception("Détails du produit non trouvés");
            }
            
            return $product;
            
        } catch (PDOException $e) {
            error_log("Erreur DB: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des détails du produit");
        }
    }
    
    private function buildBaseSqlQuery($categoryId) {
        switch ($categoryId) {
            case 1: // Smartphones
                return "SELECT DISTINCT
                        p.*,
                        JSON_UNQUOTE(p.store_urls) as store_urls,
                        JSON_UNQUOTE(p.video_urls) as video_urls,
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
                        JSON_UNQUOTE(p.store_urls) as store_urls,
                        JSON_UNQUOTE(p.video_urls) as video_urls,
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
                        JSON_UNQUOTE(p.store_urls) as store_urls,
                        JSON_UNQUOTE(p.video_urls) as video_urls,
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
    
    // Dans ProductDetailsAPI.php, modifier les méthodes buildDetailQuery :
    
    private function buildDetailQuery($categoryId) {
        switch ($categoryId) {
            case 1: // Smartphones
                return "SELECT 
                        p.*,
                        JSON_UNQUOTE(p.store_urls) as store_urls,
                        JSON_UNQUOTE(p.video_urls) as video_urls,
                        ss.ram,
                        ss.storage_capacity,
                        ss.screen_size,
                        ss.screen_resolution,
                        ss.screen_technology,
                        ss.refresh_rate,
                        ss.battery_capacity,
                        ss.operating_system,
                        ss.os_version,
                        ss.ram_rating,
                        ss.storage_rating,
                        ss.screen_rating,
                        ss.processor_rating,
                        ss.battery_rating,
                        cs.main_camera_resolution,
                        cs.front_camera_resolution,
                        sr.head_sar,
                        sr.trunk_sar,
                        sr.limb_sar
                    FROM products p
                    LEFT JOIN smartphone_specs ss ON p.id = ss.product_id
                    LEFT JOIN camera_specs cs ON p.id = cs.product_id
                    LEFT JOIN sar_ratings sr ON p.id = sr.product_id
                    WHERE p.id = :id";
    
            case 2: // Laptops
                return "SELECT 
                        p.*,
                        JSON_UNQUOTE(p.store_urls) as store_urls,
                        JSON_UNQUOTE(p.video_urls) as video_urls,
                        ms.ram_capacity,
                        ms.ram_type,
                        ms.storage_capacity,
                        ms.storage_type,
                        ps.brand as processor_brand,
                        ps.model as processor_model,
                        ps.series as processor_series,
                        gs.brand as gpu_brand,
                        gs.model as gpu_model,
                        ds.screen_size,
                        ds.screen_technology,
                        ds.resolution,
                        ds.brightness,
                        lf.has_numeric_pad,
                        lf.has_fingerprint_reader,
                        lf.has_webcam,
                        lf.has_microphone,
                        lf.speakers_count,
                        lf.keyboard_layout,
                        lf.has_fast_charging,
                        lf.is_gaming_laptop
                    FROM products p
                    LEFT JOIN memory_storage_specs ms ON p.id = ms.product_id
                    LEFT JOIN processor_specs ps ON p.id = ps.product_id
                    LEFT JOIN graphics_specs gs ON p.id = gs.product_id
                    LEFT JOIN display_specs ds ON p.id = ds.product_id
                    LEFT JOIN laptop_features lf ON p.id = lf.product_id
                    WHERE p.id = :id";
    
            case 3: // Tablets
                return "SELECT 
                        p.*,
                        JSON_UNQUOTE(p.store_urls) as store_urls,
                        JSON_UNQUOTE(p.video_urls) as video_urls,
                        ss.ram,
                        ss.storage_capacity,
                        ss.screen_size,
                        ss.screen_resolution,
                        ss.screen_technology,
                        ss.refresh_rate,
                        ss.battery_capacity,
                        ss.operating_system,
                        cs.main_camera_resolution,
                        cs.front_camera_resolution
                    FROM products p
                    LEFT JOIN smartphone_specs ss ON p.id = ss.product_id
                    LEFT JOIN camera_specs cs ON p.id = cs.product_id
                    WHERE p.id = :id";
    
            default:
                throw new Exception("Catégorie non valide");
        }
    }
}

// Traitement de la requête
try {
    $productId = isset($_GET['id']) ? (int)$_GET['id'] : null;
    
    if (!$productId) {
        throw new Exception("ID du produit non spécifié");
    }

    $api = new ProductDetailsAPI($db);
    $response = $api->getProductDetails($productId);
    
    echo json_encode([
        'success' => true,
        'data' => $response
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
<?php
require_once '../config.php';

class FiltersAPI {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getFilterOptions($type, $categoryId) {
        try {
            switch ($type) {
                case 'ram':
                    return $this->getRamOptions($categoryId);
                case 'storage':
                    return $this->getStorageOptions($categoryId);
                case 'screen_size':
                    return $this->getScreenSizeOptions($categoryId);
                case 'refresh_rate':
                    return $this->getRefreshRateOptions($categoryId);
                case 'battery':
                    return $this->getBatteryOptions($categoryId);
                case 'os':
                    return $this->getOsOptions($categoryId);
                default:
                    throw new Exception("Type de filtre non valide");
            }
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des options: " . $e->getMessage());
        }
    }

    private function getRamOptions($categoryId) {
        switch($categoryId) {
            case 1: // Smartphones
                $sql = "SELECT DISTINCT ram as value, CONCAT(ram, ' Go') as label 
                       FROM smartphone_specs 
                       WHERE ram IS NOT NULL 
                       ORDER BY ram";
                break;
            case 2: // Ordinateurs
                $sql = "SELECT DISTINCT ram_capacity as value, CONCAT(ram_capacity, ' Go') as label 
                       FROM memory_storage_specs 
                       WHERE ram_capacity IS NOT NULL AND product_id IN 
                       (SELECT id FROM products WHERE category_id = :category_id)
                       ORDER BY ram_capacity";
                break;
            case 3: // Tablettes
                $sql = "SELECT DISTINCT ram as value, CONCAT(ram, ' Go') as label 
                       FROM smartphone_specs 
                       WHERE ram IS NOT NULL AND product_id IN 
                       (SELECT id FROM products WHERE category_id = :category_id)
                       ORDER BY ram";
                break;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':category_id' => $categoryId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getStorageOptions($categoryId) {
        switch($categoryId) {
            case 1: // Smartphones
                $sql = "SELECT DISTINCT storage_capacity as value, 
                       CASE 
                           WHEN storage_capacity >= 1000 THEN CONCAT(storage_capacity/1000, ' To')
                           ELSE CONCAT(storage_capacity, ' Go')
                       END as label
                       FROM smartphone_specs 
                       WHERE storage_capacity IS NOT NULL 
                       ORDER BY storage_capacity";
                break;
            case 2: // Ordinateurs
                $sql = "SELECT DISTINCT storage_capacity as value,
                       CASE 
                           WHEN storage_capacity >= 1000 THEN CONCAT(storage_capacity/1000, ' To')
                           ELSE CONCAT(storage_capacity, ' Go')
                       END as label
                       FROM memory_storage_specs 
                       WHERE storage_capacity IS NOT NULL AND product_id IN 
                       (SELECT id FROM products WHERE category_id = :category_id)
                       ORDER BY storage_capacity";
                break;
            case 3: // Tablettes
                $sql = "SELECT DISTINCT storage_capacity as value,
                       CASE 
                           WHEN storage_capacity >= 1000 THEN CONCAT(storage_capacity/1000, ' To')
                           ELSE CONCAT(storage_capacity, ' Go')
                       END as label
                       FROM smartphone_specs 
                       WHERE storage_capacity IS NOT NULL AND product_id IN 
                       (SELECT id FROM products WHERE category_id = :category_id)
                       ORDER BY storage_capacity";
                break;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':category_id' => $categoryId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getScreenSizeOptions($categoryId) {
        switch($categoryId) {
            case 1: // Smartphones
                $sql = "SELECT DISTINCT screen_size as value, 
                       CONCAT(screen_size, '\"') as label
                       FROM smartphone_specs 
                       WHERE screen_size IS NOT NULL 
                       ORDER BY screen_size";
                break;
            case 2: // Ordinateurs
                $sql = "SELECT DISTINCT screen_size as value, 
                       CONCAT(screen_size, '\"') as label
                       FROM display_specs 
                       WHERE screen_size IS NOT NULL AND product_id IN 
                       (SELECT id FROM products WHERE category_id = :category_id)
                       ORDER BY screen_size";
                break;
            case 3: // Tablettes
                $sql = "SELECT DISTINCT screen_size as value, 
                       CONCAT(screen_size, '\"') as label
                       FROM smartphone_specs 
                       WHERE screen_size IS NOT NULL AND product_id IN 
                       (SELECT id FROM products WHERE category_id = :category_id)
                       ORDER BY screen_size";
                break;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':category_id' => $categoryId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getRefreshRateOptions($categoryId) {
        $sql = "SELECT DISTINCT refresh_rate as value, 
               CONCAT(refresh_rate, ' Hz') as label
               FROM smartphone_specs 
               WHERE refresh_rate IS NOT NULL 
               AND product_id IN (SELECT id FROM products WHERE category_id = :category_id)
               ORDER BY refresh_rate";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':category_id' => $categoryId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getBatteryOptions($categoryId) {
        $sql = "SELECT DISTINCT 
               CASE 
                   WHEN battery_capacity <= 3000 THEN 3000
                   WHEN battery_capacity <= 4000 THEN 4000
                   WHEN battery_capacity <= 5000 THEN 5000
                   ELSE 6000
               END as value,
               CASE 
                   WHEN battery_capacity <= 3000 THEN '3000+ mAh'
                   WHEN battery_capacity <= 4000 THEN '4000+ mAh'
                   WHEN battery_capacity <= 5000 THEN '5000+ mAh'
                   ELSE '6000+ mAh'
               END as label
               FROM smartphone_specs 
               WHERE battery_capacity IS NOT NULL 
               AND product_id IN (SELECT id FROM products WHERE category_id = :category_id)
               GROUP BY 
               CASE 
                   WHEN battery_capacity <= 3000 THEN 3000
                   WHEN battery_capacity <= 4000 THEN 4000
                   WHEN battery_capacity <= 5000 THEN 5000
                   ELSE 6000
               END
               ORDER BY value";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':category_id' => $categoryId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getOsOptions($categoryId) {
        switch($categoryId) {
            case 1: // Smartphones
                $sql = "SELECT DISTINCT operating_system as value, 
                       operating_system as label
                       FROM smartphone_specs 
                       WHERE operating_system IS NOT NULL 
                       ORDER BY operating_system";
                break;
            case 2: // Ordinateurs
                // Pour les ordinateurs, vous pourriez avoir une autre source pour l'OS
                $sql = "SELECT 'Windows' as value, 'Windows' as label
                       UNION SELECT 'macOS', 'macOS'
                       UNION SELECT 'Linux', 'Linux'";
                break;
            case 3: // Tablettes
                $sql = "SELECT DISTINCT operating_system as value, 
                       operating_system as label
                       FROM smartphone_specs 
                       WHERE operating_system IS NOT NULL 
                       AND product_id IN (SELECT id FROM products WHERE category_id = :category_id)
                       ORDER BY operating_system";
                break;
        }
        
        $stmt = $this->db->prepare($sql);
        if ($categoryId != 2) {
            $stmt->execute([':category_id' => $categoryId]);
        } else {
            $stmt->execute();
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Traitement de la requête
try {
    $type = $_GET['type'] ?? null;
    $categoryId = $_GET['category'] ?? null;
    
    if (!$type || !$categoryId) {
        throw new Exception("Paramètres manquants");
    }
    
    $api = new FiltersAPI($db);
    $options = $api->getFilterOptions($type, $categoryId);
    
    echo json_encode([
        'success' => true,
        'data' => $options
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
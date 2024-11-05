<?php
require_once 'config.php';

class CategoryHandler {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getProductsByCategory($categoryId, $filters = []) {
        $sql = "SELECT p.*, 
                       m.ram_capacity, m.storage_capacity,
                       pr.brand as processor_brand, pr.model as processor_model,
                       d.screen_size, d.resolution
                FROM products p
                LEFT JOIN memory_storage_specs m ON p.id = m.product_id
                LEFT JOIN processor_specs pr ON p.id = pr.product_id
                LEFT JOIN display_specs d ON p.id = d.product_id
                WHERE p.category_id = :category_id";
        
        $params = [':category_id' => $categoryId];
        
        // Ajout des filtres
        if (!empty($filters['min_price'])) {
            $sql .= " AND p.price >= :min_price";
            $params[':min_price'] = $filters['min_price'];
        }
        
        if (!empty($filters['max_price'])) {
            $sql .= " AND p.price <= :max_price";
            $params[':max_price'] = $filters['max_price'];
        }
        
        if (!empty($filters['manufacturer'])) {
            $sql .= " AND p.manufacturer = :manufacturer";
            $params[':manufacturer'] = $filters['manufacturer'];
        }
        
        if (!empty($filters['min_rating'])) {
            $sql .= " AND p.rating >= :min_rating";
            $params[':min_rating'] = $filters['min_rating'];
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getManufacturersByCategory($categoryId) {
        $sql = "SELECT DISTINCT manufacturer 
                FROM products 
                WHERE category_id = :category_id 
                AND manufacturer IS NOT NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':category_id' => $categoryId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
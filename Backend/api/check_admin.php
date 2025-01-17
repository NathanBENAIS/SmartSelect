<?php
require_once '../config.php';
// require_once 'check_admin.php'; // Commenté pour le debug

header('Content-Type: application/json');
error_log('Admin API called with action: ' . ($_GET['action'] ?? 'none'));

$action = $_GET['action'] ?? '';

try {
    $db = getDB();

    switch ($action) {
        case 'get_tables':
            error_log('Getting tables list');
            // Récupérer la liste des tables
            $stmt = $db->query("SHOW TABLES");
            if (!$stmt) {
                error_log('Error executing SHOW TABLES: ' . print_r($db->errorInfo(), true));
                throw new Exception('Erreur lors de la récupération des tables');
            }
            
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            error_log('Tables found: ' . print_r($tables, true));
            
            echo json_encode([
                'success' => true,
                'data' => $tables
            ]);
            break;

        case 'get_table_data':
            $table = $_GET['table'] ?? '';
            if (empty($table)) {
                throw new Exception('Nom de table requis');
            }
            
            error_log("Getting data for table: $table");
            $stmt = $db->query("SELECT * FROM `$table` LIMIT 100");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $data
            ]);
            break;

        default:
            throw new Exception('Action non valide');
    }

} catch (Exception $e) {
    error_log('Error in admin.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
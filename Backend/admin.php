<?php
require_once 'config.php';
header('Content-Type: application/json');
error_log('Admin API called with action: ' . ($_GET['action'] ?? 'none'));

function sanitizeTableName($table) {
    return preg_replace('/[^a-zA-Z0-9_]/', '', $table);
}

try {
    $db = getDB();
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'get_tables':
            $stmt = $db->query("SHOW TABLES");
            if (!$stmt) {
                throw new Exception('Erreur lors de la récupération des tables');
            }
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo json_encode(['success' => true, 'data' => $tables]);
            break;

        case 'get_table_data':
            $table = sanitizeTableName($_GET['table'] ?? '');
            if (empty($table)) {
                throw new Exception('Nom de table requis');
            }
            
            $stmt = $db->query("SELECT * FROM `$table` LIMIT 100");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'update_record':
            $input = json_decode(file_get_contents('php://input'), true);
            $table = sanitizeTableName($input['table'] ?? '');
            $id = filter_var($input['id'] ?? '', FILTER_VALIDATE_INT);
            $data = $input['data'] ?? [];

            if (empty($table) || $id === false || empty($data)) {
                throw new Exception('Données invalides pour la mise à jour');
            }

            $setParts = [];
            $params = [];
            foreach ($data as $key => $value) {
                if ($key !== 'id') { // Éviter de modifier l'ID
                    $setParts[] = "`" . sanitizeTableName($key) . "` = ?";
                    $params[] = $value;
                }
            }
            $params[] = $id;

            $sql = "UPDATE `$table` SET " . implode(', ', $setParts) . " WHERE id = ?";
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);

            if ($result) {
                echo json_encode(['success' => true]);
            } else {
                throw new Exception('Erreur lors de la mise à jour');
            }
            break;

        case 'add_record':
            $input = json_decode(file_get_contents('php://input'), true);
            $table = sanitizeTableName($input['table'] ?? '');
            $data = $input['data'] ?? [];

            if (empty($table) || empty($data)) {
                throw new Exception('Données invalides pour l\'ajout');
            }

            $columns = [];
            $placeholders = [];
            $params = [];
            foreach ($data as $key => $value) {
                if ($key !== 'id') { // Ne pas inclure l'ID pour un nouvel enregistrement
                    $columns[] = "`" . sanitizeTableName($key) . "`";
                    $placeholders[] = "?";
                    $params[] = $value;
                }
            }

            $sql = "INSERT INTO `$table` (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
            $stmt = $db->prepare($sql);
            $result = $stmt->execute($params);

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'id' => $db->lastInsertId()
                ]);
            } else {
                throw new Exception('Erreur lors de l\'ajout');
            }
            break;

        case 'delete_record':
            $input = json_decode(file_get_contents('php://input'), true);
            $table = sanitizeTableName($input['table'] ?? '');
            $id = filter_var($input['id'] ?? '', FILTER_VALIDATE_INT);

            if (empty($table) || $id === false) {
                throw new Exception('Données invalides pour la suppression');
            }

            $stmt = $db->prepare("DELETE FROM `$table` WHERE id = ?");
            $result = $stmt->execute([$id]);

            if ($result) {
                echo json_encode(['success' => true]);
            } else {
                throw new Exception('Erreur lors de la suppression');
            }
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
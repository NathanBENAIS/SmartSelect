<?php
// Sauvegardez dans Backend/api/generate-metrics.php
require_once '../config.php';
require_once '../telemetryHandler.php';

// Initialisation
$telemetry = TelemetryHandler::getInstance();

// Générer des requêtes test
$endpoints = [
    '/products/category/1',
    '/products/category/2',
    '/products/search',
    '/products/getAll'
];

$statuses = ['200', '404', '500'];

// Générer des métriques pour chaque endpoint
foreach ($endpoints as $endpoint) {
    foreach ($statuses as $status) {
        // Simuler entre 1 et 5 requêtes
        $requests = rand(1, 5);
        for ($i = 0; $i < $requests; $i++) {
            $telemetry->recordAPIRequest($endpoint, $status);
            $telemetry->recordResponseTime($endpoint, rand(100, 1000) / 1000);
        }
    }
}

// Simuler des recherches
$searches = [
    'iphone' => 5,
    'samsung' => 3,
    'laptop' => 4
];

foreach ($searches as $query => $results) {
    $telemetry->recordSearchRequest($query, $results);
}

// Simuler des comptages de produits
$categories = [
    'category_1' => 25,
    'category_2' => 30,
    'category_3' => 15
];

foreach ($categories as $category => $count) {
    $telemetry->recordProductCount($category, $count);
}

// Afficher les métriques
header('Content-Type: text/plain; version=0.0.4');
echo $telemetry->formatMetrics();
?>
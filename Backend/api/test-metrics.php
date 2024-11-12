<?php
// Sauvegardez comme test-metrics.php
require_once '../config.php';
require_once '../telemetryHandler.php';

$telemetry = TelemetryHandler::getInstance();

// Générer des requêtes test simples
$endpoints = [
    '/products/category/1',
    '/products/category/2',
    '/products/search',
    '/products/getAll'
];

$statuses = ['200', '404', '500'];

foreach ($endpoints as $endpoint) {
    foreach ($statuses as $status) {
        // Générer entre 1 et 3 requêtes pour chaque combinaison
        $requests = rand(1, 3);
        for ($i = 0; $i < $requests; $i++) {
            $telemetry->recordAPIRequest($endpoint, $status);
            $duration = rand(100, 500) / 1000;  // Entre 0.1 et 0.5 secondes
            $telemetry->recordResponseTime($endpoint, $duration);
            
            if ($status === '200') {
                $telemetry->recordDBQueryTime($endpoint, $duration * 0.7); // 70% du temps total
            }
        }
    }
}

// Afficher les métriques
header('Content-Type: text/plain; version=0.0.4');
echo $telemetry->formatMetrics();
<?php
// Sauvegardez comme metrics-check.php
require_once '../config.php';
require_once '../telemetryHandler.php';

// Headers pour éviter la mise en cache
header('Content-Type: text/plain; version=0.0.4');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

// Initialisation
$telemetry = TelemetryHandler::getInstance();

// Générer quelques métriques de test simples
$telemetry->recordAPIRequest('/products/category/1', '200');
$telemetry->recordAPIRequest('/products/search', '200');

// Enregistrer quelques produits
$telemetry->recordProductCount('category_1', 10);
$telemetry->recordProductCount('category_2', 15);

// Enregistrer une connexion active
$telemetry->recordActiveConnections(1);

// Afficher les métriques
$metrics = $telemetry->formatMetrics();

// Log pour debug
error_log('Generating metrics at: ' . date('Y-m-d H:i:s'));
error_log('Metrics output: ' . $metrics);

echo $metrics;
?>
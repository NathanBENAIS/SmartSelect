<?php
// Backend/api/metrics.php
require_once '../config.php';
require_once '../telemetryHandler.php';

// Activer tous les logs d'erreur pour le débogage
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Headers pour métriques Prometheus
header('Content-Type: text/plain; version=0.0.4');

// Générer quelques métriques de test directement ici
$telemetry = TelemetryHandler::getInstance();

// Générer des métriques test
$telemetry->recordAPIRequest('/products/category/1', '200');
$telemetry->recordAPIRequest('/products/search', '200');
$telemetry->recordAPIRequest('/products/getAll', '200');

// Temps de réponse
$telemetry->recordResponseTime('/products/category/1', 0.5);
$telemetry->recordResponseTime('/products/search', 0.3);

// Log des métriques pour débogage
$metrics = $telemetry->formatMetrics();
error_log("Métriques générées : \n" . $metrics);

// Afficher les métriques
echo $metrics;
<?php
header('Content-Type: text/plain');

require_once '../telemetryHandler.php';

$telemetry = TelemetryHandler::getInstance();
echo $telemetry->formatPrometheusMetrics();
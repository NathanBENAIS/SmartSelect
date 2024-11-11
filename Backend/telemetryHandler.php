<?php
class TelemetryHandler {
    private $prometheusStorage;
    private $metrics;

    public function __construct() {
        $this->prometheusStorage = new Redis();
        $this->prometheusStorage->connect('127.0.0.1', 6379);
        $this->initializeMetrics();
    }

    private function initializeMetrics() {
        // Compteur pour les requêtes API
        $this->metrics['api_requests_total'] = new Counter([
            'name' => 'smartselect_api_requests_total',
            'help' => 'Total des requêtes API',
            'labels' => ['endpoint', 'method', 'status']
        ]);

        // Histogramme pour le temps de réponse
        $this->metrics['api_response_time'] = new Histogram([
            'name' => 'smartselect_api_response_time_seconds',
            'help' => 'Temps de réponse API en secondes',
            'labels' => ['endpoint'],
            'buckets' => [0.1, 0.25, 0.5, 1, 2.5, 5, 10]
        ]);

        // Gauge pour les utilisateurs connectés
        $this->metrics['active_users'] = new Gauge([
            'name' => 'smartselect_active_users',
            'help' => 'Nombre d\'utilisateurs actuellement connectés'
        ]);

        // Compteur pour les actions spécifiques
        $this->metrics['user_actions'] = new Counter([
            'name' => 'smartselect_user_actions_total',
            'help' => 'Actions utilisateur',
            'labels' => ['action_type']
        ]);

        // Gauge pour le nombre de produits
        $this->metrics['products_count'] = new Gauge([
            'name' => 'smartselect_products_total',
            'help' => 'Nombre total de produits'
        ]);
    }

    public function recordAPIRequest($endpoint, $method, $status, $startTime) {
        // Enregistrer le nombre de requêtes
        $this->metrics['api_requests_total']->inc([
            'endpoint' => $endpoint,
            'method' => $method,
            'status' => $status
        ]);

        // Enregistrer le temps de réponse
        $duration = microtime(true) - $startTime;
        $this->metrics['api_response_time']->observe(['endpoint' => $endpoint], $duration);
    }

    public function recordUserAction($actionType) {
        $this->metrics['user_actions']->inc(['action_type' => $actionType]);
    }

    public function updateActiveUsers($count) {
        $this->metrics['active_users']->set($count);
    }

    public function updateProductsCount($count) {
        $this->metrics['products_count']->set($count);
    }

    public function collectMetrics() {
        $registry = new CollectorRegistry($this->prometheusStorage);
        foreach ($this->metrics as $metric) {
            $registry->register($metric);
        }
        return $registry->render();
    }
}
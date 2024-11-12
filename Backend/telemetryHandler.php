<?php
class TelemetryHandler {
    private static $instance = null;
    private $metrics = [];
    
    private function __construct() {
        $this->initializeMetrics();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function initializeMetrics() {
        $this->metrics = [
            'counters' => [
                'api_requests' => [
                    'name' => 'smartselect_api_requests_total',
                    'help' => 'Total number of API requests',
                    'type' => 'counter',
                    'values' => []
                ],
                'search_requests' => [
                    'name' => 'smartselect_search_requests_total',
                    'help' => 'Total number of search requests',
                    'type' => 'counter',
                    'values' => []
                ],
                'errors' => [
                    'name' => 'smartselect_errors_total',
                    'help' => 'Total number of errors',
                    'type' => 'counter',
                    'values' => []
                ]
            ],
            'histograms' => [
                'response_time' => [
                    'name' => 'smartselect_response_time_seconds',
                    'help' => 'Response time in seconds',
                    'type' => 'histogram',
                    'values' => []
                ],
                'db_query_time' => [
                    'name' => 'smartselect_db_query_time_seconds',
                    'help' => 'Database query execution time in seconds',
                    'type' => 'histogram',
                    'values' => []
                ]
            ],
            'gauges' => [
                'products_count' => [
                    'name' => 'smartselect_products_total',
                    'help' => 'Number of products by category',
                    'type' => 'gauge',
                    'values' => []
                ],
                'active_connections' => [
                    'name' => 'smartselect_active_connections',
                    'help' => 'Number of active database connections',
                    'type' => 'gauge',
                    'values' => []
                ]
            ]
        ];
    }
    
    public function recordAPIRequest($endpoint, $status) {
        $labels = [
            'path' => $endpoint,
            'status' => $status
        ];
        $key = $this->formatLabels($labels);
        if (!isset($this->metrics['counters']['api_requests']['values'][$key])) {
            $this->metrics['counters']['api_requests']['values'][$key] = 0;
        }
        $this->metrics['counters']['api_requests']['values'][$key]++;
        error_log("API Request recorded: $endpoint, $status");
    }
    
    public function recordResponseTime($endpoint, $duration) {
        $labels = ['path' => $endpoint];
        $this->metrics['histograms']['response_time']['values'][] = [
            'labels' => $this->formatLabels($labels),
            'value' => $duration
        ];
    }

    public function recordDBQueryTime($queryType, $duration) {
        $labels = ['query_type' => $queryType];
        $this->metrics['histograms']['db_query_time']['values'][] = [
            'labels' => $this->formatLabels($labels),
            'value' => $duration
        ];
        error_log("DB Query Time recorded: $queryType, Duration: $duration");
    }
    
    public function recordSearchRequest($query, $resultCount) {
        $labels = [
            'query_length' => strlen($query),
            'results' => $resultCount
        ];
        $key = $this->formatLabels($labels);
        if (!isset($this->metrics['counters']['search_requests']['values'][$key])) {
            $this->metrics['counters']['search_requests']['values'][$key] = 0;
        }
        $this->metrics['counters']['search_requests']['values'][$key]++;
    }
    
    public function recordProductCount($category, $count) {
        $labels = ['category' => $category];
        $key = $this->formatLabels($labels);
        $this->metrics['gauges']['products_count']['values'][$key] = $count;
    }
    
    public function recordActiveConnections($count) {
        $this->metrics['gauges']['active_connections']['values']['total'] = $count;
    }
    
    private function formatLabels($labels) {
        if (empty($labels)) {
            return '';
        }
        $parts = [];
        foreach ($labels as $key => $value) {
            // Échapper les caractères spéciaux dans la valeur
            $value = str_replace('"', '\"', $value);
            $parts[] = $key . '="' . $value . '"';
        }
        return '{' . implode(',', $parts) . '}';
    }
    
    public function formatMetrics() {
        $output = "";
        
        // Format counters
        foreach ($this->metrics['counters'] as $metric) {
            $output .= "# HELP {$metric['name']} {$metric['help']}\n";
            $output .= "# TYPE {$metric['name']} {$metric['type']}\n";
            foreach ($metric['values'] as $labels => $value) {
                $output .= "{$metric['name']}{$labels} $value\n";
            }
            $output .= "\n";
        }
        
        // Format histograms
        foreach ($this->metrics['histograms'] as $metric) {
            $output .= "# HELP {$metric['name']} {$metric['help']}\n";
            $output .= "# TYPE {$metric['name']} {$metric['type']}\n";
            foreach ($metric['values'] as $data) {
                $output .= "{$metric['name']}{$data['labels']} {$data['value']}\n";
            }
            $output .= "\n";
        }
        
        // Format gauges
        foreach ($this->metrics['gauges'] as $metric) {
            $output .= "# HELP {$metric['name']} {$metric['help']}\n";
            $output .= "# TYPE {$metric['name']} {$metric['type']}\n";
            foreach ($metric['values'] as $labels => $value) {
                if ($labels === 'total') {
                    $output .= "{$metric['name']} $value\n";
                } else {
                    $output .= "{$metric['name']}{$labels} $value\n";
                }
            }
            $output .= "\n";
        }
        
        return $output;
    }
}
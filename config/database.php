<?php
/**
 * Database Configuration - DEMO MODE
 * Uses flat-file JSON storage. No MySQL required.
 * Data stored in /data/*.json
 */
return [
    'data_dir' => getenv('DATA_DIR') ?: __DIR__ . '/../data',
];

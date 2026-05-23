<?php
/**
 * Settings model - DEMO MODE
 * Manages system configuration settings.
 */
class Settings {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get all settings as key-value array
     */
    public function getAll(): array {
        $stmt = $this->db->query('SELECT setting_key, setting_value, description FROM settings ORDER BY setting_key');
        $settings = [];
        while ($row = $stmt->fetch()) {
            $settings[$row['setting_key']] = [
                'value' => $row['setting_value'],
                'description' => $row['description'],
            ];
        }
        return $settings;
    }

    /**
     * Get a single setting value
     */
    public function get(string $key, string $default = ''): string {
        return getSetting($this->db, $key, $default);
    }

    /**
     * Set/update a setting
     */
    public function set(string $key, string $value, ?string $description = null, int $adminId = 0): void {
        $old = getSetting($this->db, $key, '');
        $stmt = $this->db->prepare(
            'INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), description = COALESCE(VALUES(description), description)'
        );
        $stmt->execute([$key, $value, $description]);
        if ($adminId > 0) {
            logAdminAction($this->db, $adminId, 'update_setting', 'settings', null, "$key: $old", "$key: $value");
        }
    }
}

<?php
/**
 * Settings model - Supabase PostgreSQL backend
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
        $rows = $this->db->query('settings', [], 'setting_key,setting_value,description', 'setting_key.asc');
        $settings = [];
        foreach ($rows as $row) {
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

        $existing = $this->db->query('settings', ['setting_key' => 'eq.' . $key], 'id', '', 1);

        if (empty($existing)) {
            $this->db->post('settings', [
                'setting_key' => $key,
                'setting_value' => $value,
                'description' => $description,
            ]);
        } else {
            $updates = ['setting_value' => $value];
            if ($description !== null) {
                $updates['description'] = $description;
            }
            $this->db->patch('settings', ['setting_key' => 'eq.' . $key], $updates);
        }

        if ($adminId > 0) {
            logAdminAction($this->db, $adminId, 'update_setting', 'settings', null, "$key: $old", "$key: $value");
        }
    }
}

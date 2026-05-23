<?php
/**
 * Database Configuration - Supabase PostgreSQL
 * Uses Supabase REST API for all data operations.
 * Environment variables set in Vercel dashboard or .env file.
 */
$supabaseUrl = getenv('SUPABASE_URL');
if (empty($supabaseUrl)) {
    error_log('[CONFIG] FATAL: SUPABASE_URL environment variable is not set');
}

return [
    'supabase_url' => getenv('SUPABASE_URL'),
    'supabase_anon_key' => getenv('SUPABASE_ANON_KEY'),
    'supabase_service_role_key' => getenv('SUPABASE_SERVICE_ROLE_KEY'),
];

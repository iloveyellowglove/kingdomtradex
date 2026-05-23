<?php
/**
 * Database Configuration - Supabase PostgreSQL
 * Uses Supabase REST API for all data operations.
 * Environment variables set in .env file.
 */
return [
    'supabase_url' => getenv('SUPABASE_URL') ?: 'https://rzegwboainzivhhbqoff.supabase.co',
    'supabase_anon_key' => getenv('SUPABASE_ANON_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZWd3Ym9haW56aXZoaGJxb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTY2ODQsImV4cCI6MjA5NTA3MjY4NH0.goz2cRoULlphYXR6Sx5AWhTABZwLar53g7kLi0daomI',
    'supabase_service_role_key' => getenv('SUPABASE_SERVICE_ROLE_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZWd3Ym9haW56aXZoaGJxb2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ5NjY4NCwiZXhwIjoyMDk1MDcyNjg0fQ.FyODYfL2JbYd50q9CdPVO-9f0FtoNZKpihGuIZd7nRY',
];

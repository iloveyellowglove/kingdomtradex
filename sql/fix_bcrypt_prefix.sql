-- Run this in Supabase SQL Editor to fix existing bcrypt hashes for PHP 8.5.2+
-- PHP 8.5.2 has a known incompatibility with $2y$ bcrypt prefix; $2b$ is required.
UPDATE users SET password_hash = REPLACE(password_hash, '$2y$', '$2b$') WHERE email = 'admin@demo.local';

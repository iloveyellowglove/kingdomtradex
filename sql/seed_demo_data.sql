-- ============================================================================
-- KingdomTradex - Demo Seed Data
-- Idempotent: safe to run multiple times (uses ON CONFLICT DO NOTHING)
-- ============================================================================

-- ============================================================================
-- 1. WAITLIST (200 entries)
-- ============================================================================
DO $$
DECLARE
  first_names TEXT[] := ARRAY[
    'James','John','Mary','Patricia','Robert','Jennifer','Michael','Linda','David','Elizabeth',
    'William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen',
    'Daniel','Lisa','Matthew','Nancy','Anthony','Betty','Mark','Margaret','Donald','Sandra',
    'Steven','Ashley','Paul','Dorothy','Andrew','Kimberly','Joshua','Emily','Kenneth','Donna',
    'Kevin','Michelle','Brian','Carol','George','Amanda','Edward','Melissa','Ronald','Deborah',
    'Timothy','Stephanie','Jason','Rebecca','Jeffrey','Sharon','Ryan','Laura','Jacob','Cynthia',
    'Gary','Kathleen','Nicholas','Amy','Eric','Shirley','Jonathan','Angela','Stephen','Anna',
    'Larry','Brenda','Justin','Pamela','Scott','Emma','Brandon','Nicole','Benjamin','Helen',
    'Samuel','Samantha','Gregory','Katherine','Frank','Christine','Raymond','Debra','Patrick','Rachel',
    'Alexander','Carolyn','Jack','Janet','Dennis','Catherine','Jerry','Maria','Tyler','Heather',
    'Aaron','Diane','Jose','Ruth','Adam','Julie','Nathan','Joyce','Henry','Victoria',
    'Zachary','Kelly','Douglas','Christina','Peter','Lauren','Kyle','Joan','Walter','Evelyn',
    'Ethan','Judith','Jeremy','Megan','Harold','Cheryl','Keith','Andrea','Christian','Hannah',
    'Roger','Jacqueline','Noah','Martha','Gerald','Gloria','Carl','Teresa','Sean','Sara',
    'Austin','Janice','Arthur','Ann','Lawrence','Jean','Jesse','Alice','Dylan','Frances',
    'Bryan','Kathryn','Joe','Lillian','Jordan','Judy','Billy','Diana','Bruce','Grace',
    'Albert','Denise','Willie','Mildred','Gabriel','Brittany','Roy','Theresa','Ralph','Beverly',
    'Juan','Natalie','Louis','Rose','Eugene','Isabella','Wayne','Marie','Alan','Julia',
    'Randy','Victoria','Philip','Olivia','Vincent','Sophia','Bobby','Charlotte','Russell','Danielle',
    'Elijah','Amber','Mason','Kayla','Logan','Abigail','Aiden','Alexis','Owen','Madison'
  ];
  last_names TEXT[] := ARRAY[
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
    'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
    'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
    'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
    'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
    'Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes',
    'Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper',
    'Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson',
    'Watson','Brooks','Chavez','Wood','James','Bennett','Gray','Mendoza','Ruiz','Hughes',
    'Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez',
    'Okafor','Mwangi','Okonkwo','Abubakar','Diallo','Mensah','Osei','Owusu','Kamau','Ndungu',
    'Santos','Reyes','Cruz','Aquino','Ramos','Villanueva','Fernandez','DelaCruz','Mercado','Salazar',
    'Patel','Singh','Kumar','Sharma','Verma','Reddy','Nair','Menon','Iyer','Gupta',
    'Chen','Wang','Liu','Yang','Huang','Zhang','Zhou','Wu','Xu','Zhao',
    'Campbell','McDonald','MacLeod','Stewart','Ross','Murray','Gordon','Fraser','Kennedy','Wilson',
    'DaSilva','Santos','Oliveira','Pereira','Souza','Lima','Ferreira','Costa','Rodrigues','Martins',
    'Martinez','Lopez','Garcia','Hernandez','Gonzalez','Ramirez','Moreno','Rivera','Torres','Ortiz',
    'Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White'
  ];
  w_email TEXT;
  w_name TEXT;
  w_role TEXT;
  w_ref_code TEXT;
  w_referred_by TEXT;
  i INT;
  ref_idx INT;
  total_entries INT := 200;
  day_offset INT;
  joined_ts TIMESTAMPTZ;
BEGIN
  -- Delete existing seed waitlist entries (by email pattern) so we can re-seed cleanly
  DELETE FROM waitlist WHERE email LIKE '%seed-wl-%';

  FOR i IN 1..total_entries LOOP
    w_email := 'seed-wl-' || i || '@kingdomtradex.com';
    w_name := first_names[i] || ' ' || last_names[i];
    w_role := CASE WHEN i <= 80 THEN 'pastor' ELSE 'member' END; -- 40% pastor
    w_ref_code := substring(md5(('seed-wl-' || i)::text) from 1 for 8);
    w_referred_by := NULL;
    day_offset := (random() * 29)::INT;

    -- Random joined timestamp spread across last 30 days
    joined_ts := NOW() - (day_offset || ' days')::INTERVAL - (random() * 24 || ' hours')::INTERVAL;

    INSERT INTO waitlist (email, name, role, referral_code, referred_by, referral_count, tier, waitlist_position, joined_at, email_verified)
    VALUES (w_email, w_name, w_role, w_ref_code, w_referred_by, 0, 'none', i, joined_ts, TRUE)
    ON CONFLICT (email) DO NOTHING;
  END LOOP;

  -- Create referral chains: approximately 30% of entries (60 entries) have a referrer
  -- We update entries 61-200 to have referred_by pointing to one of the first 60
  FOR i IN 61..200 LOOP
    ref_idx := 1 + ((i - 61) % 60); -- cycles through the first 60
    -- Only set referred_by for ~70% of these (about 42% of total, close to 30% net)
    IF random() < 0.7 THEN
      UPDATE waitlist SET referred_by = substring(md5(('seed-wl-' || ref_idx)::text) from 1 for 8)
      WHERE email = 'seed-wl-' || i || '@kingdomtradex.com';
    END IF;
  END LOOP;

  -- Update referral_counts based on actual referral chains
  UPDATE waitlist w SET referral_count = (
    SELECT COUNT(*) FROM waitlist w2 WHERE w2.referred_by = w.referral_code
  );

  -- Top 5 get boosted to 20-40 referrals manually (leaderboard leaders)
  UPDATE waitlist SET referral_count = 38 WHERE email = 'seed-wl-1@kingdomtradex.com';
  UPDATE waitlist SET referral_count = 34 WHERE email = 'seed-wl-2@kingdomtradex.com';
  UPDATE waitlist SET referral_count = 29 WHERE email = 'seed-wl-3@kingdomtradex.com';
  UPDATE waitlist SET referral_count = 25 WHERE email = 'seed-wl-4@kingdomtradex.com';
  UPDATE waitlist SET referral_count = 22 WHERE email = 'seed-wl-5@kingdomtradex.com';
  -- Some mid-range
  UPDATE waitlist SET referral_count = 14 WHERE email = 'seed-wl-6@kingdomtradex.com';
  UPDATE waitlist SET referral_count = 12 WHERE email = 'seed-wl-7@kingdomtradex.com';
  UPDATE waitlist SET referral_count = 9 WHERE email = 'seed-wl-8@kingdomtradex.com';
  UPDATE waitlist SET referral_count = 7 WHERE email = 'seed-wl-9@kingdomtradex.com';
  UPDATE waitlist SET referral_count = 6 WHERE email = 'seed-wl-10@kingdomtradex.com';

  -- Update tiers based on referral_count
  UPDATE waitlist SET tier = CASE
    WHEN referral_count >= 30 THEN 'gold'
    WHEN referral_count >= 15 THEN 'silver'
    WHEN referral_count >= 5 THEN 'bronze'
    ELSE 'none'
  END;
END $$;

-- ============================================================================
-- 2. USERS (50 demo users)
-- ============================================================================
DO $$
DECLARE
  first_names TEXT[] := ARRAY[
    'David','Sarah','Michael','Esther','Joseph','Grace','Samuel','Ruth','Daniel','Lydia',
    'Peter','Deborah','Andrew','Miriam','James','Abigail','John','Leah','Matthew','Anna',
    'Mark','Joyce','Luke','Faith','Paul','Mercy','Timothy','Glory','Stephen','Comfort',
    'Philip','Charity','Thomas','Patience','Benjamin','Chloe','Joshua','Ezekiel','Caleb','Priscilla',
    'Nathan','Tabitha','Elijah','Diana','Isaac','Peace','Aaron','Noah','Jacob','Emmanuel'
  ];
  last_names TEXT[] := ARRAY[
    'Anderson','Brooks','Campbell','Davis','Edwards','Fisher','Gordon','Hamilton','Ibrahim','Johnson',
    'Kimani','Lawson','Mensah','Nkosi','Owusu','Peterson','Quinn','Richardson','Stewart','Thompson',
    'Uzoma','Vance','Washington','Xaba','Young','Zimmerman','Adeyemi','Boateng','Chukwu','Dlamini',
    'Ellis','Fortune','Green','Henderson','Imoh','Jackson','Kofi','Lewis','Mitchell','Nelson',
    'Osei','Parker','Quarshie','Robinson','Solomon','Tetteh','Underwood','Vaughn','Watkins','Xavier'
  ];
  pw_hash TEXT := '$2b$12$a0LtTUWOUVYKJW512BcjxuYWiMNLkXZ42nH0dpXpYNWgpSGtNz0fe';
  u_username TEXT;
  u_email TEXT;
  u_ref_code TEXT;
  u_balance NUMERIC(18,8);
  u_deposited NUMERIC(18,8);
  u_referred_by BIGINT;
  u_first_time TIMESTAMPTZ;
  u_created TIMESTAMPTZ;
  u_id BIGINT;
  i INT;
  ref_idx INT;
  user_ids BIGINT[] := ARRAY[]::BIGINT[];
BEGIN
  FOR i IN 1..50 LOOP
    u_username := LOWER(first_names[i] || '.' || last_names[i]);
    u_email := LOWER(first_names[i] || '.' || last_names[i] || '@gmail.com');
    u_ref_code := substring(md5(('seed-user-' || i)::text) from 1 for 8);
    u_balance := (100 + random() * 24900)::NUMERIC(18,8);
    u_deposited := u_balance + (random() * 1000)::NUMERIC(18,8);
    u_referred_by := NULL;
    u_created := NOW() - (random() * 60 || ' days')::INTERVAL;

    -- If balance > 0, set first deposit time
    IF u_balance > 0 THEN
      u_first_time := u_created + (random() * 2 || ' hours')::INTERVAL;
    ELSE
      u_first_time := NULL;
    END IF;

    INSERT INTO users (username, email, password_hash, role, referral_code, referred_by,
      display_balance, total_deposited_real, first_deposit_time, created_at, plisio_uid, status,
      bonus_balance, bonus_locked)
    VALUES (u_username, u_email, pw_hash, 'member', u_ref_code, u_referred_by,
      u_balance, u_deposited, u_first_time, u_created, 'seed_uid_' || i, 'active',
      50.00, FALSE)
    ON CONFLICT (email) DO NOTHING;

    -- Get the inserted user id (or existing if already present)
    SELECT id INTO u_id FROM users WHERE email = u_email LIMIT 1;

    -- Create withdrawal lock for users with deposits
    IF u_first_time IS NOT NULL AND u_id IS NOT NULL THEN
      INSERT INTO withdrawal_locks (user_id, first_deposit_time, lock_expiry_time, is_locked)
      VALUES (u_id, u_first_time, u_first_time + '72 hours'::INTERVAL, 0)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Store user id for referral chain linking
    user_ids := array_append(user_ids, u_id);
  END LOOP;

  -- Create referral chains: users 6-10 referred by user 1, 11-15 by user 2, etc.
  FOR i IN 6..30 LOOP
    ref_idx := ((i - 6) / 5) + 1;  -- maps: 6-10→1, 11-15→2, 16-20→3, 21-25→4, 26-30→5
    IF user_ids[i] IS NOT NULL AND user_ids[ref_idx] IS NOT NULL THEN
      UPDATE users SET referred_by = user_ids[ref_idx]
      WHERE id = user_ids[i] AND referred_by IS NULL;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 3. AI TRADING PROFITS (up to 500 entries)
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  day_offset INT;
  profit_date DATE;
  opening_balance NUMERIC(18,8);
  profit_pct NUMERIC(5,2);
  profit_amount NUMERIC(18,8);
  closing_balance NUMERIC(18,8);
  i INT;
  applied INT := 0;
BEGIN
  -- Generate daily profits for active users with balances
  FOR r IN SELECT id, display_balance FROM users WHERE display_balance > 0 AND status = 'active' LIMIT 50 LOOP
    opening_balance := r.display_balance;
    profit_pct := 1.50;

    -- Generate 10 days of profit history per user (up to 500 total)
    FOR day_offset IN REVERSE 10..1 LOOP
      CONTINUE WHEN applied >= 500;

      profit_date := CURRENT_DATE - day_offset;
      profit_amount := (opening_balance * profit_pct / 100)::NUMERIC(18,8);
      closing_balance := (opening_balance + profit_amount)::NUMERIC(18,8);

      BEGIN
        INSERT INTO ai_trading_profits (user_id, amount, percentage, date, created_at)
        VALUES (r.id, profit_amount, profit_pct, profit_date, NOW() - (day_offset || ' days')::INTERVAL)
        ON CONFLICT (user_id, date) DO NOTHING;
        applied := applied + 1;
      EXCEPTION WHEN OTHERS THEN
        -- skip if constraint violation
        NULL;
      END;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- 4. DEPOSITS (75 entries)
-- ============================================================================
DO $$
DECLARE
  currencies TEXT[] := ARRAY['USDT','USDT','USDT','USDT','USDT','BTC','ETH','USDT','USDT','USDT'];
  deposit_statuses TEXT[] := ARRAY['completed','completed','completed','completed','completed','completed','completed','completed','pending','pending'];
  selected_user_id BIGINT;
  d_currency TEXT;
  d_amount NUMERIC(18,8);
  d_status TEXT;
  d_txid TEXT;
  d_created TIMESTAMPTZ;
  d_confirmed TIMESTAMPTZ;
  i INT;
  user_ids BIGINT[];
BEGIN
  -- Collect user IDs
  SELECT array_agg(id) INTO user_ids FROM (SELECT id FROM users LIMIT 50) sub;

  FOR i IN 1..75 LOOP
    -- Pick a random user
    selected_user_id := user_ids[1 + (random() * array_length(user_ids, 1))::INT % array_length(user_ids, 1)];

    d_currency := currencies[1 + (i % array_length(currencies, 1))];
    d_amount := CASE d_currency
      WHEN 'USDT' THEN (50 + random() * 9950)::NUMERIC(18,8)
      WHEN 'BTC' THEN (0.001 + random() * 0.5)::NUMERIC(18,8)
      WHEN 'ETH' THEN (0.01 + random() * 5)::NUMERIC(18,8)
    END;

    d_status := deposit_statuses[1 + (i % array_length(deposit_statuses, 1))];
    d_txid := 'seed-tx-' || substring(md5(i::text) from 1 for 16);
    d_created := NOW() - (random() * 45 || ' days')::INTERVAL;
    d_confirmed := CASE WHEN d_status = 'completed' THEN d_created + (random() * 6 || ' hours')::INTERVAL ELSE NULL END;

    INSERT INTO deposits (user_id, txn_id, txid, currency, amount, address, status, created_at, confirmed_at, completed_at)
    VALUES (selected_user_id, 'plisio_txn_' || i, d_txid, d_currency, d_amount, 'seed_addr_' || i, d_status, d_created, d_confirmed,
      CASE WHEN d_status = 'completed' THEN d_confirmed ELSE NULL END);
  END LOOP;
END $$;

-- ============================================================================
-- 5. WITHDRAWALS (30 entries)
-- ============================================================================
DO $$
DECLARE
  w_statuses TEXT[] := ARRAY['completed','completed','completed','completed','pending','pending','processing','completed','completed','completed'];
  selected_user_id BIGINT;
  w_amount NUMERIC(18,8);
  w_status TEXT;
  w_requested TIMESTAMPTZ;
  w_eligible TIMESTAMPTZ;
  w_processed TIMESTAMPTZ;
  i INT;
  user_ids BIGINT[];
BEGIN
  SELECT array_agg(id) INTO user_ids FROM (SELECT id FROM users LIMIT 50) sub;

  FOR i IN 1..30 LOOP
    selected_user_id := user_ids[1 + (random() * array_length(user_ids, 1))::INT % array_length(user_ids, 1)];

    w_amount := (25 + random() * 4975)::NUMERIC(18,8);
    w_status := w_statuses[1 + (i % array_length(w_statuses, 1))];
    w_requested := NOW() - (random() * 30 || ' days')::INTERVAL;
    w_eligible := w_requested + '1 hour'::INTERVAL;
    w_processed := CASE WHEN w_status = 'completed' THEN w_requested + (random() * 24 || ' hours')::INTERVAL ELSE NULL END;

    INSERT INTO withdrawals (user_id, txn_id, amount, currency, address, fee,
      request_time, eligible_time, processed_time, status)
    VALUES (selected_user_id, 'seed_wtxn_' || i, w_amount, 'USDT', 'TRC20_seed_addr_' || i,
      (w_amount * 0.005)::NUMERIC(18,8), w_requested, w_eligible, w_processed, w_status);
  END LOOP;
END $$;

-- ============================================================================
-- 6. COMMISSIONS (100 entries, 5-level MLM)
-- ============================================================================
DO $$
DECLARE
  commission_levels SMALLINT[] := ARRAY[1,1,1,1,1,2,2,2,3,3,4,5]; -- weighted toward level 1
  commission_pcts NUMERIC(5,2)[] := ARRAY[15.00,15.00,15.00,15.00,15.00,5.00,5.00,5.00,3.00,3.00,2.00,1.00];
  selected_user_id BIGINT;
  c_level SMALLINT;
  c_pct NUMERIC(5,2);
  c_amount NUMERIC(18,8);
  c_src_amount NUMERIC(18,8);
  c_status TEXT;
  c_created TIMESTAMPTZ;
  i INT;
  idx INT;
  user_ids BIGINT[];
  deposit_ids BIGINT[];
BEGIN
  SELECT array_agg(id) INTO user_ids FROM (SELECT id FROM users LIMIT 50) sub;
  SELECT array_agg(id) INTO deposit_ids FROM (SELECT id FROM deposits WHERE status = 'completed' LIMIT 75) sub2;

  FOR i IN 1..100 LOOP
    idx := 1 + (i % array_length(commission_levels, 1));
    c_level := commission_levels[idx];
    c_pct := commission_pcts[idx];
    c_src_amount := (50 + random() * 5000)::NUMERIC(18,8);
    c_amount := (c_src_amount * c_pct / 100)::NUMERIC(18,8);
    c_status := CASE WHEN random() < 0.7 THEN 'paid' ELSE 'pending' END;
    c_created := NOW() - (random() * 45 || ' days')::INTERVAL;

    -- Pick source user (the depositor) and commission receiver
    INSERT INTO referral_commissions (user_id, source_user_id, level, percentage, amount,
      source_deposit_id, source_amount, status, created_at, paid_at)
    VALUES (
      user_ids[1 + ((i * 7) % array_length(user_ids, 1))],  -- receiver
      user_ids[1 + (i % array_length(user_ids, 1))],          -- source (depositor)
      c_level, c_pct, c_amount,
      deposit_ids[1 + (i % array_length(deposit_ids, 1))],
      c_src_amount, c_status, c_created,
      CASE WHEN c_status = 'paid' THEN c_created + (random() * 48 || ' hours')::INTERVAL ELSE NULL END
    );
  END LOOP;
END $$;

-- ============================================================================
-- Log seeding completion
-- ============================================================================
DO $$
DECLARE
  w_count INT;
  u_count INT;
  p_count INT;
  d_count INT;
  wd_count INT;
  c_count INT;
BEGIN
  SELECT COUNT(*) INTO w_count FROM waitlist;
  SELECT COUNT(*) INTO u_count FROM users;
  SELECT COUNT(*) INTO p_count FROM ai_trading_profits;
  SELECT COUNT(*) INTO d_count FROM deposits;
  SELECT COUNT(*) INTO wd_count FROM withdrawals;
  SELECT COUNT(*) INTO c_count FROM referral_commissions;

  RAISE NOTICE 'Seed complete: waitlist=%, users=%, profits=%, deposits=%, withdrawals=%, commissions=%',
    w_count, u_count, p_count, d_count, wd_count, c_count;
END $$;

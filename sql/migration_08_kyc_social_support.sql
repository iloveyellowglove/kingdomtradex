-- ============================================================================
-- Migration 08: KYC 4-Level System + Social Connect + Support Attachments + Principal Withdrawal Cooling
-- ============================================================================

-- 1. Add KYC 4-level columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_authenticator_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_proof_of_address_url TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_proof_of_address_submitted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Social connect columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_twitter TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_telegram TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_instagram TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_facebook TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_twitter_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_telegram_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_instagram_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_facebook_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_reward_claimed BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Support ticket attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);

-- 4. Principal withdrawal cooling period
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS cooling_end_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS is_early BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. Update kyc_submissions for Level 3 and Level 4 tracking
ALTER TABLE kyc_submissions ADD COLUMN IF NOT EXISTS submission_type TEXT NOT NULL DEFAULT 'id_selfie' CHECK (submission_type IN ('id_selfie', 'proof_of_address'));
ALTER TABLE kyc_submissions ADD COLUMN IF NOT EXISTS kyc_level INTEGER NOT NULL DEFAULT 3;

-- 6. RPC: claim social reward (atomic, once per user)
CREATE OR REPLACE FUNCTION claim_social_reward(p_user_id BIGINT)
RETURNS TABLE(success BOOLEAN, reward_amount NUMERIC, message TEXT) AS $$
DECLARE
  v_count INTEGER;
  v_already_claimed BOOLEAN;
BEGIN
  SELECT social_reward_claimed INTO v_already_claimed FROM users WHERE id = p_user_id;
  IF v_already_claimed THEN
    success := FALSE; reward_amount := 0; message := 'Reward already claimed.';
    RETURN NEXT; RETURN;
  END IF;

  SELECT COUNT(*) INTO v_count FROM users WHERE id = p_user_id
    AND social_twitter_verified = TRUE
    AND social_telegram_verified = TRUE
    AND social_instagram_verified = TRUE
    AND social_facebook_verified = TRUE;

  IF v_count = 0 THEN
    success := FALSE; reward_amount := 0; message := 'All 4 social platforms must be verified first.';
    RETURN NEXT; RETURN;
  END IF;

  UPDATE users SET signup_credit = signup_credit + 10, social_reward_claimed = TRUE WHERE id = p_user_id;
  success := TRUE; reward_amount := 10; message := '$10 bonus credit added to your account.';
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

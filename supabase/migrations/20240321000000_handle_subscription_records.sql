-- Function to handle subscription record management
CREATE OR REPLACE FUNCTION handle_subscription_record(
  p_customer_id TEXT,
  p_status TEXT
) RETURNS void AS $$
BEGIN
  -- First check for existing subscription
  WITH existing_sub AS (
    SELECT id 
    FROM stripe_subscriptions 
    WHERE customer_id = p_customer_id 
    AND deleted_at IS NULL
  )
  -- If subscription exists, soft delete it
  UPDATE stripe_subscriptions 
  SET deleted_at = NOW()
  WHERE id IN (SELECT id FROM existing_sub);

  -- Create new subscription record
  INSERT INTO stripe_subscriptions (
    customer_id,
    status
  ) VALUES (
    p_customer_id,
    p_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION handle_subscription_record(TEXT, TEXT) TO authenticated;

-- Create a trigger to automatically handle subscription records
CREATE OR REPLACE FUNCTION handle_subscription_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new subscription record
  IF (TG_OP = 'INSERT') THEN
    -- Call the handler function
    PERFORM handle_subscription_record(NEW.customer_id, NEW.status);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS subscription_record_trigger ON stripe_subscriptions;
CREATE TRIGGER subscription_record_trigger
  BEFORE INSERT ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_trigger(); 
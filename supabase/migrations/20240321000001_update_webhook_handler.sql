-- Update the webhook handler to use the new subscription record management function
CREATE OR REPLACE FUNCTION handle_stripe_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- For subscription events
  IF (TG_TABLE_NAME = 'stripe_subscriptions') THEN
    -- Call the subscription record handler
    PERFORM handle_subscription_record(NEW.customer_id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the webhook trigger
DROP TRIGGER IF EXISTS stripe_webhook_trigger ON stripe_subscriptions;
CREATE TRIGGER stripe_webhook_trigger
  AFTER INSERT OR UPDATE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_stripe_webhook(); 
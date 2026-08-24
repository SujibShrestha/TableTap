-- Prevent hard deletion of Order rows.
-- Orders must be cancelled via status = 'CANCELLED', never deleted.

CREATE OR REPLACE FUNCTION prevent_order_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Orders cannot be deleted. Use status = CANCELLED instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER block_order_delete
BEFORE DELETE ON "Order"
FOR EACH ROW EXECUTE FUNCTION prevent_order_delete();
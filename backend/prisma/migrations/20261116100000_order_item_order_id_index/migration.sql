-- Analytics joins OrderItem to Order on every dashboard request; the FK had no index.
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

import crypto from "crypto";

interface EsewaPayload {
  amount: number;
  transactionUuid: string;
}

/**
 * Generate HMAC-SHA256 signature for eSewa ePay form submission.
 *
 * Per the eSewa docs, the signature message is:
 *   total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}
 * where total_amount must match the value sent in the form (2 decimal places).
 */
export function generateEsewaSignature(payload: EsewaPayload): string {
  const { amount, transactionUuid } = payload;
  const merchantCode = process.env.ESEWA_MERCHANT_CODE;
  const secretKey = process.env.ESEWA_SECRET_KEY;

  if (!merchantCode || !secretKey) {
    throw new Error("Esewa merchant code or secret key is not defined in environment variables.");
  }

  // total_amount in signature must match the form field (2 decimal places)
  const totalAmount = amount.toFixed(2);
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`;

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(message);
  return hmac.digest("base64");
}
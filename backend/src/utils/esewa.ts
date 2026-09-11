import crypto from "crypto";

interface EsewaPayload{
    amount :number;
    transactionUuid :string;
}

export function generateEsewaSignature(payload: EsewaPayload): string {
    const { amount, transactionUuid } = payload;
    const merchantCode = process.env.ESEWA_MERCHANT_CODE;
    const secretKey = process.env.ESEWA_SECRET_KEY;

    if (!merchantCode || !secretKey) {
        throw new Error("Esewa merchant code or secret key is not defined in environment variables.");
    }

    const message = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`;
    const hmac = crypto.createHmac("sha256", secretKey);

    hmac.update(message);
    return hmac.digest("base64");
}       
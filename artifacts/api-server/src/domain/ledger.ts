import { createHash } from "node:crypto";

export interface LedgerPayload {
  transactionId: string;
  tradeId: string;
  amountInr: string;
  quantityKwh: string;
  settledAt: string;
}

export function hashTransaction(payload: LedgerPayload) {
  const canonical = JSON.stringify({
    amountInr: payload.amountInr,
    quantityKwh: payload.quantityKwh,
    settledAt: payload.settledAt,
    tradeId: payload.tradeId,
    transactionId: payload.transactionId,
  });
  return createHash("sha256").update(canonical).digest("hex");
}
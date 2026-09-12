export type GridTradeEvent =
  | { type: "price.updated"; priceInrPerKwh: string; occurredAt: string }
  | { type: "grid.updated"; decision: "APPROVED" | "ADJUSTED" | "RESTRICTED"; occurredAt: string }
  | { type: "listing.created"; listingId: string; occurredAt: string }
  | { type: "listing.closed"; listingId: string; occurredAt: string }
  | { type: "match.recommended"; matchId: string; occurredAt: string }
  | { type: "trade.updated"; tradeId: string; status: string; occurredAt: string }
  | { type: "transaction.created"; transactionId: string; occurredAt: string }
  | { type: "alert.created"; alertId: string; severity: "info" | "warning" | "critical"; occurredAt: string };

export interface EventPublisher {
  publish(event: GridTradeEvent): Promise<void>;
}

export class NoopEventPublisher implements EventPublisher {
  async publish(_event: GridTradeEvent) {
    // Socket.IO can be attached after durable persistence commits.
  }
}
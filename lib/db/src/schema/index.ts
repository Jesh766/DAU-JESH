import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "PROSUMER",
  "CONSUMER",
  "UTILITY",
  "REGULATOR",
  "ADMIN",
]);

export const solarSystemStatus = pgEnum("solar_system_status", [
  "online",
  "standby",
  "offline",
]);

export const listingStatus = pgEnum("listing_status", [
  "active",
  "matched",
  "closed",
  "restricted",
]);

export const tradeStatus = pgEnum("trade_status", [
  "proposed",
  "confirmed",
  "settled",
  "cancelled",
]);

export const transactionStatus = pgEnum("transaction_status", [
  "pending",
  "confirmed",
  "failed",
]);

export const gridDecision = pgEnum("grid_decision", [
  "APPROVED",
  "ADJUSTED",
  "RESTRICTED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").unique(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
    role: userRole("role").notNull().default("PROSUMER"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("users_role_idx").on(table.role)],
);

export const solarSystems = pgTable(
  "solar_systems",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    capacityKw: numeric("capacity_kw", { precision: 12, scale: 3 }).notNull(),
    location: text("location").notNull(),
    status: solarSystemStatus("status").notNull().default("online"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("solar_systems_owner_idx").on(table.ownerId)],
);

export const energyData = pgTable(
  "energy_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    solarSystemId: uuid("solar_system_id")
      .notNull()
      .references(() => solarSystems.id),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    generationKwh: numeric("generation_kwh", { precision: 14, scale: 4 }).notNull(),
    consumptionKwh: numeric("consumption_kwh", { precision: 14, scale: 4 }).notNull(),
    marketableSurplusKwh: numeric("marketable_surplus_kwh", {
      precision: 14,
      scale: 4,
    }).notNull(),
    source: text("source").notNull().default("prototype"),
  },
  (table) => [
    index("energy_data_system_observed_idx").on(
      table.solarSystemId,
      table.observedAt,
    ),
  ],
);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id),
    solarSystemId: uuid("solar_system_id")
      .notNull()
      .references(() => solarSystems.id),
    quantityKwh: numeric("quantity_kwh", { precision: 14, scale: 4 }).notNull(),
    priceInrPerKwh: numeric("price_inr_per_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    availableFrom: timestamp("available_from", {
      withTimezone: true,
    }).notNull(),
    availableUntil: timestamp("available_until", {
      withTimezone: true,
    }).notNull(),
    status: listingStatus("status").notNull().default("active"),
    gridDecision: gridDecision("grid_decision").notNull().default("APPROVED"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("listings_status_idx").on(table.status),
    index("listings_seller_idx").on(table.sellerId),
  ],
);

export const trades = pgTable(
  "trades",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id),
    quantityKwh: numeric("quantity_kwh", { precision: 14, scale: 4 }).notNull(),
    agreedPriceInrPerKwh: numeric("agreed_price_inr_per_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    status: tradeStatus("status").notNull().default("proposed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("trades_listing_idx").on(table.listingId),
    index("trades_buyer_idx").on(table.buyerId),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tradeId: uuid("trade_id")
      .notNull()
      .references(() => trades.id),
    amountInr: numeric("amount_inr", { precision: 14, scale: 4 }).notNull(),
    status: transactionStatus("status").notNull().default("pending"),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("transactions_trade_idx").on(table.tradeId)],
);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id),
  provider: text("provider").notNull().default("prototype"),
  providerReference: text("provider_reference"),
  amountInr: numeric("amount_inr", { precision: 14, scale: 4 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const hashRecords = pgTable(
  "hash_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transactionId: uuid("transaction_id")
      .notNull()
      .unique()
      .references(() => transactions.id),
    algorithm: text("algorithm").notNull().default("SHA-256"),
    hash: text("hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("hash_records_transaction_idx").on(table.transactionId)],
);

export const gridData = pgTable(
  "grid_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    region: text("region").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    congestionPercent: numeric("congestion_percent", {
      precision: 6,
      scale: 3,
    }).notNull(),
    renewableSharePercent: numeric("renewable_share_percent", {
      precision: 6,
      scale: 3,
    }).notNull(),
    frequencyHz: numeric("frequency_hz", { precision: 8, scale: 4 }).notNull(),
    decision: gridDecision("decision").notNull(),
  },
  (table) => [index("grid_data_region_observed_idx").on(table.region, table.observedAt)],
);

export const aiPredictions = pgTable(
  "ai_predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gridDataId: uuid("grid_data_id").references(() => gridData.id),
    predictionType: text("prediction_type").notNull(),
    horizon: text("horizon").notNull(),
    payload: text("payload").notNull(),
    confidence: numeric("confidence", { precision: 6, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("ai_predictions_type_idx").on(table.predictionType)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    requestId: text("request_id"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorId),
    index("audit_logs_created_idx").on(table.createdAt),
  ],
);

export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
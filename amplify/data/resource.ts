import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

/**
 * Data schema → DynamoDB tables + AppSync GraphQL API
 * Stored as JSON strings where we need nested objects (location, store, product snapshot).
 * 
 * ALL TABLES ARE PUBLIC (API Key) - No authentication required!
 */

const schema = a.schema({
  // User profile (no auth required)
  UserProfile: a
    .model({
      name: a.string().required(),
      email: a.string().required(),
      phone: a.string(),
      role: a.string().required(), // "customer" | "runner"
      locationJson: a.string(), // JSON: { latitude, longitude, address?, neighborhood? }
      trustScore: a.float(),
      joinedAt: a.string().required(),
      avatar: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Product catalog (public access)
  Product: a
    .model({
      name: a.string().required(),
      category: a.string().required(),
      description: a.string(),
      unit: a.string().required(),
      retailPrice: a.float().required(),
      bulkPrice: a.float().required(),
      bulkMinimum: a.integer().required(),
      storeJson: a.string().required(), // JSON: Store
      available: a.boolean(),
      image: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // User pledge (public access)
  Pledge: a
    .model({
      userId: a.string().required(),
      productId: a.string().required(),
      productSnapshotJson: a.string().required(), // Product at pledge time
      quantity: a.integer().required(),
      unitPrice: a.float().required(),
      totalAmount: a.float().required(),
      maxAmount: a.float().required(),
      status: a.string().required(), // pending | locked | active | completed | cancelled | rollover
      orderId: a.string(),
      lockedAt: a.string(),
      completedAt: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Bulk order round (public access)
  BulkOrder: a
    .model({
      productId: a.string().required(),
      productSnapshotJson: a.string().required(),
      totalQuantity: a.integer().required(),
      targetQuantity: a.integer().required(),
      pricePerUnit: a.float().required(),
      status: a.string().required(), // collecting | pending_execution | assigned | shopping | in_transit | distributing | completed | rolled_over | cancelled
      cutoffTime: a.string().required(),
      executedAt: a.string(),
      runnerId: a.string(),
      dropZoneJson: a.string(), // JSON: Location
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});

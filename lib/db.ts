import { MongoClient, ServerApiVersion } from 'mongodb';

// Use placeholder during build when env may be unset; runtime will use real MONGODB_URI from .env
const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nextjs';
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = globalThis as typeof globalThis & { _mongoClient?: MongoClient };
  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }
  client = globalWithMongo._mongoClient;
} else {
  client = new MongoClient(uri, options);
}

export default client;

/** Promise that resolves to a connected MongoClient (adapter requires connected client). */
export const clientPromise = client.connect().then(() => client);

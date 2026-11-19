import { MockSetmoreClient } from "./mock";
import type { SetmoreClient } from "./types";

// Kept on globalThis because Next.js can load each API route as a separate
// module, and they all need to share one in-memory mock.
const globalForMock = globalThis as typeof globalThis & {
  mockSetmore?: MockSetmoreClient;
};

export function getSetmoreClient(): SetmoreClient {
  if (process.env.SETMORE_MODE === "mock") {
    globalForMock.mockSetmore ??= new MockSetmoreClient();
    return globalForMock.mockSetmore;
  }
  throw new Error("SETMORE_MODE must be set to mock");
}

/**
 * Type stub for @prisma/client
 * This file provides type definitions when @prisma/client is not installed
 * Install @prisma/client and run `npx prisma generate` to get actual types
 */

declare module '@prisma/client' {
  export class PrismaClient {
    adoptionListing: {
      findMany: (args?: unknown) => Promise<unknown[]>;
      findUnique: (args?: unknown) => Promise<unknown | null>;
      create: (args?: unknown) => Promise<unknown>;
      update: (args?: unknown) => Promise<unknown>;
      delete: (args?: unknown) => Promise<unknown>;
      count: (args?: unknown) => Promise<number>;
    };
    adoptionApplication: {
      findMany: (args?: unknown) => Promise<unknown[]>;
      findUnique: (args?: unknown) => Promise<unknown | null>;
      create: (args?: unknown) => Promise<unknown>;
      update: (args?: unknown) => Promise<unknown>;
      delete: (args?: unknown) => Promise<unknown>;
    };
    [key: string]: unknown;
  }
}


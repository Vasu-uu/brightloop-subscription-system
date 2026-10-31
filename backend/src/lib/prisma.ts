// Re-export so modules written against `lib/prisma` (P3) and `shared/prisma`
// (P2) share the same client instance.
export { prisma } from "../shared/prisma";

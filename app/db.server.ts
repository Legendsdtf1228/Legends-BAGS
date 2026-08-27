import { PrismaClient } from "@prisma/client";

/** Bump when migrations add models — busts dev global Prisma cache. */
export const PRISMA_SCHEMA_TOKEN = "20260827230000_admin_ops";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaSchemaToken: string | undefined;
}

const REQUIRED_DELEGATES = [
  "galleryCategory",
  "designAssignment",
  "shopFont",
  "fitCheckTemplate",
] as const;

type DelegateName = (typeof REQUIRED_DELEGATES)[number];

function createPrismaClient() {
  return new PrismaClient();
}

function delegateReady(client: PrismaClient, name: DelegateName): boolean {
  const delegate = (client as unknown as Record<string, { findMany?: unknown } | undefined>)[name];
  return Boolean(delegate && typeof delegate.findMany === "function");
}

function allDelegatesReady(client: PrismaClient): boolean {
  return REQUIRED_DELEGATES.every((name) => delegateReady(client, name));
}

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    if (!global.prismaGlobal) global.prismaGlobal = createPrismaClient();
    return global.prismaGlobal;
  }

  const stale =
    !global.prismaGlobal ||
    global.prismaSchemaToken !== PRISMA_SCHEMA_TOKEN ||
    !allDelegatesReady(global.prismaGlobal);

  if (stale) {
    void global.prismaGlobal?.$disconnect().catch(() => undefined);
    global.prismaGlobal = createPrismaClient();
    global.prismaSchemaToken = PRISMA_SCHEMA_TOKEN;
  }

  return global.prismaGlobal!;
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;

export function isPrismaClientReady(): boolean {
  try {
    return allDelegatesReady(getPrismaClient());
  } catch {
    return false;
  }
}

export class MerchantDbNotReadyError extends Error {
  readonly code = "MERCHANT_DB_NOT_READY";

  constructor(message?: string) {
    super(
      message ??
        "Database client is out of date. Run npm run setup, then restart the dev server (stop shopify app dev and start it again).",
    );
    this.name = "MerchantDbNotReadyError";
  }
}

export function assertPrismaDelegate(name: DelegateName) {
  const client = getPrismaClient();
  const delegate = (client as unknown as Record<string, { findMany?: unknown } | undefined>)[name];
  if (!delegate?.findMany) {
    throw new MerchantDbNotReadyError(
      `The ${name} database model is unavailable. Run npm run setup, then restart the dev server.`,
    );
  }
  return delegate as {
    findMany: (...args: unknown[]) => Promise<unknown>;
    findFirst: (...args: unknown[]) => Promise<unknown>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
    updateMany: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
    count: (...args: unknown[]) => Promise<number>;
  };
}

export async function probeMerchantDb(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    for (const name of REQUIRED_DELEGATES) assertPrismaDelegate(name);
    await getPrismaClient().galleryCategory.findMany({ take: 1 });
    return { ok: true };
  } catch (err) {
    if (err instanceof MerchantDbNotReadyError) return { ok: false, message: err.message };
    if (err instanceof Error && /no such table/i.test(err.message)) {
      return {
        ok: false,
        message: "Database migrations are pending. Run npm run setup, then restart the dev server.",
      };
    }
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Database unavailable. Run npm run setup, then restart the dev server.",
    };
  }
}

import prisma from "../db.server";
import {
  builderTypeFromBinding,
  type BuilderLaunchContext,
  type BuilderLaunchParseError,
  type BuilderLaunchQuery,
  parseBuilderLaunchQuery,
} from "../domain/builder/builder-launch-context";
import { resolveProductBinding as lookupBinding } from "./editor-config.server";

export type BuilderLaunchResolveResult =
  | { ok: true; context: BuilderLaunchContext }
  | BuilderLaunchParseError
  | {
      ok: false;
      code: "binding_not_found";
      message: string;
      diagnostic: {
        shop: string;
        productId: string;
        productGid: string;
        variantId?: string;
        variantGid?: string;
        bindingFound: false;
      };
    };

export async function resolveBuilderLaunch(
  input: BuilderLaunchQuery,
): Promise<BuilderLaunchResolveResult> {
  const parsed = parseBuilderLaunchQuery(input);
  if (!parsed.ok) return parsed;

  const binding = await lookupBinding(
    parsed.input.shop,
    parsed.input.productGid,
    parsed.input.variantGid,
  );

  if (!binding) {
    return {
      ok: false,
      code: "binding_not_found",
      message: "This product has not been connected to Legends BAGS yet.",
      diagnostic: {
        shop: parsed.input.shop,
        productId: parsed.input.productId,
        productGid: parsed.input.productGid,
        variantId: parsed.input.variantId,
        variantGid: parsed.input.variantGid,
        bindingFound: false,
      },
    };
  }

  const builderType = builderTypeFromBinding(binding.builderType);
  if (!builderType) {
    return {
      ok: false,
      code: "binding_not_found",
      message: "This product has not been connected to Legends BAGS yet.",
      diagnostic: {
        shop: parsed.input.shop,
        productId: parsed.input.productId,
        productGid: parsed.input.productGid,
        variantId: parsed.input.variantId,
        variantGid: parsed.input.variantGid,
        bindingFound: false,
      },
    };
  }

  return {
    ok: true,
    context: {
      ...parsed.input,
      builderType,
    },
  };
}

/** Test helper — count bindings without exposing prisma in route tests. */
export async function countProductBindings(shop: string): Promise<number> {
  return prisma.productBinding.count({ where: { shop } });
}

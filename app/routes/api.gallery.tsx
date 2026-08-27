import type { LoaderFunctionArgs } from "react-router";
import { listGalleryCategories, listGalleryItems } from "../services/gallery-service";
import { assertCustomerApiAccess } from "../domain/security/test-access";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = assertCustomerApiAccess(request);
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "All";
  const search = url.searchParams.get("search") ?? undefined;

  const [categories, items] = await Promise.all([
    listGalleryCategories(shop),
    listGalleryItems(shop, { category, search }),
  ]);

  return Response.json({
    categories: ["All", ...categories.map((c) => c.name)],
    items,
  });
}

import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { createAssetFromUpload } from "../services/design-service";
import {
  addGalleryAsset,
  createGalleryCategory,
  deleteGalleryAsset,
  deleteGalleryCategory,
  listGalleryAdmin,
  updateGalleryAsset,
} from "../services/gallery-service";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  try {
    const data = await listGalleryAdmin(session.shop);
    return { ...data, loadError: null as string | null };
  } catch (err) {
    return {
      categories: [] as Awaited<ReturnType<typeof listGalleryAdmin>>["categories"],
      assets: [] as Awaited<ReturnType<typeof listGalleryAdmin>>["assets"],
      loadError: err instanceof Error ? err.message : "Gallery is temporarily unavailable.",
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  try {
    if (intent === "add_category") {
      await createGalleryCategory(shop, String(form.get("name") || ""));
      return { ok: true, message: "Category added." };
    }
    if (intent === "delete_category") {
      await deleteGalleryCategory(shop, String(form.get("categoryId")));
      return { ok: true, message: "Category removed." };
    }
    if (intent === "upload_asset") {
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error("Choose a PNG or JPEG file");
      const bytes = Buffer.from(await file.arrayBuffer());
      const asset = await createAssetFromUpload(shop, bytes);
      await addGalleryAsset({
        shop,
        categoryId: String(form.get("categoryId")),
        assetId: asset.id,
        name: String(form.get("name") || file.name),
        tags: String(form.get("tags") || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        widthIn: Number(form.get("widthIn") || 3),
        heightIn: Number(form.get("heightIn") || 3),
      });
      return { ok: true, message: `"${file.name}" added to gallery.` };
    }
    if (intent === "toggle_active") {
      const id = String(form.get("assetId"));
      const active = form.get("active") === "1";
      await updateGalleryAsset(shop, id, { active });
      return { ok: true, message: active ? "Item enabled." : "Item hidden." };
    }
    if (intent === "delete_asset") {
      await deleteGalleryAsset(shop, String(form.get("assetId")));
      return { ok: true, message: "Gallery item deleted." };
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Action failed" };
  }

  return null;
};

export default function GallerySettingsPage() {
  const { categories, assets, loadError } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader
        title="Gallery Settings"
        subtitle="Stock art for the customer gang sheet editor — categories, tags, and uploads"
      />
      <div className="bags-admin-content">
        {loadError ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p style={{ color: "#b42318", margin: 0 }}>{loadError}</p>
            <p className="bags-admin-muted" style={{ margin: "8px 0 0" }}>
              Run <code>npm run setup</code>, then restart <code>shopify app dev</code>.
            </p>
          </BagsCard>
        ) : null}
        {actionData?.message ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p className="bags-admin-muted" role="status">
              {actionData.message}
            </p>
          </BagsCard>
        ) : null}

        <div className="bags-admin-grid" style={{ gridTemplateColumns: "1fr 1.4fr", marginBottom: 16 }}>
          <BagsCard title="Categories">
            <ul className="bags-admin-muted" style={{ paddingLeft: 18, margin: "0 0 12px" }}>
              {categories.map((cat) => (
                <li key={cat.id} style={{ marginBottom: 6 }}>
                  <strong>{cat.name}</strong> · {cat._count.assets} item{cat._count.assets === 1 ? "" : "s"}
                  {cat._count.assets === 0 ? (
                    <Form method="post" style={{ display: "inline", marginLeft: 8 }}>
                      <input type="hidden" name="intent" value="delete_category" />
                      <input type="hidden" name="categoryId" value={cat.id} />
                      <button type="submit" className="bags-admin-btn ghost" style={{ padding: "2px 8px" }}>
                        Delete
                      </button>
                    </Form>
                  ) : null}
                </li>
              ))}
            </ul>
            <Form method="post" className="bags-admin-form" style={{ display: "flex", gap: 8 }}>
              <input type="hidden" name="intent" value="add_category" />
              <input name="name" type="text" placeholder="New category name" required />
              <button type="submit" className="bags-admin-btn primary">
                Add
              </button>
            </Form>
          </BagsCard>

          <BagsCard title="Upload gallery art">
            <Form
              method="post"
              encType="multipart/form-data"
              className="bags-admin-form"
              style={{ display: "grid", gap: 10 }}
            >
              <input type="hidden" name="intent" value="upload_asset" />
              <label>
                Category
                <select name="categoryId" required>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Display name
                <input name="name" type="text" placeholder="Artwork name" />
              </label>
              <label>
                Tags (comma-separated)
                <input name="tags" type="text" placeholder="sports, mascot" />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label>
                  Default width (in)
                  <input name="widthIn" type="number" step="0.1" defaultValue="3" />
                </label>
                <label>
                  Default height (in)
                  <input name="heightIn" type="number" step="0.1" defaultValue="3" />
                </label>
              </div>
              <label>
                PNG or JPEG file
                <input name="file" type="file" accept="image/png,image/jpeg" required />
              </label>
              <button type="submit" className="bags-admin-btn primary">
                Upload to gallery
              </button>
            </Form>
          </BagsCard>
        </div>

        <BagsCard title={`Gallery items (${assets.length})`}>
          <table className="bags-admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Name</th>
                <th>Category</th>
                <th>Tags</th>
                <th>Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((row) => (
                <tr key={row.id}>
                  <td>
                    <img
                      src={row.thumbUrl || `/api/assets/${encodeURIComponent(row.assetId)}`}
                      alt=""
                      style={{ width: 44, height: 44, objectFit: "contain" }}
                    />
                  </td>
                  <td>{row.name}</td>
                  <td>{row.category.name}</td>
                  <td>{row.tags || "—"}</td>
                  <td>
                    {row.defaultWidthIn}×{row.defaultHeightIn}″
                  </td>
                  <td>{row.active ? "Active" : "Hidden"}</td>
                  <td>
                    <div className="bags-admin-actions">
                      <Form method="post">
                        <input type="hidden" name="intent" value="toggle_active" />
                        <input type="hidden" name="assetId" value={row.id} />
                        <input type="hidden" name="active" value={row.active ? "0" : "1"} />
                        <button type="submit" className="bags-admin-btn ghost">
                          {row.active ? "Hide" : "Show"}
                        </button>
                      </Form>
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete_asset" />
                        <input type="hidden" name="assetId" value={row.id} />
                        <button type="submit" className="bags-admin-btn ghost">
                          Delete
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  createDesignAssignment,
  deleteDesignAssignment,
  listDesignAssignments,
  updateAssignmentStatus,
} from "../services/assignment-service";
import { listStaffSheets } from "../services/design-service";
import { BagsPageHeader, BagsCard } from "../components/merchant/bags-admin-ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [assignments, staffSheets] = await Promise.all([
    listDesignAssignments(session.shop),
    listStaffSheets(session.shop),
  ]);
  return { assignments, staffSheets };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  try {
    if (intent === "assign") {
      await createDesignAssignment({
        shop: session.shop,
        designId: String(form.get("designId")),
        assigneeName: String(form.get("assigneeName") || ""),
        assigneeEmail: String(form.get("assigneeEmail") || "") || undefined,
        notes: String(form.get("notes") || "") || undefined,
      });
      return { ok: true, message: "Assignment created." };
    }
    if (intent === "complete") {
      await updateAssignmentStatus(session.shop, String(form.get("assignmentId")), "completed");
      return { ok: true, message: "Marked completed." };
    }
    if (intent === "reopen") {
      await updateAssignmentStatus(session.shop, String(form.get("assignmentId")), "pending");
      return { ok: true, message: "Reopened." };
    }
    if (intent === "delete") {
      await deleteDesignAssignment(session.shop, String(form.get("assignmentId")));
      return { ok: true, message: "Assignment removed." };
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Action failed" };
  }
  return null;
};

export default function BuildAssignPage() {
  const { assignments, staffSheets } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <BagsPageHeader
        title="Build & Assign"
        subtitle="Assign staff-built or customer designs to a person or order follow-up"
      />
      <div className="bags-admin-content">
        {actionData?.message ? (
          <BagsCard style={{ marginBottom: 16 }}>
            <p className="bags-admin-muted">{actionData.message}</p>
          </BagsCard>
        ) : null}

        <BagsCard title="New assignment">
          <Form method="post" className="bags-admin-form" style={{ display: "grid", gap: 10, maxWidth: 480 }}>
            <input type="hidden" name="intent" value="assign" />
            <label>
              Design
              <select name="designId" required>
                <option value="">Select design…</option>
                {staffSheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    [Staff] {s.name || s.id.slice(0, 12)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Assignee name
              <input name="assigneeName" type="text" required placeholder="Customer or team member" />
            </label>
            <label>
              Email (optional)
              <input name="assigneeEmail" type="email" placeholder="customer@example.com" />
            </label>
            <label>
              Notes
              <textarea name="notes" rows={2} placeholder="Order #, due date, special instructions…" />
            </label>
            <button type="submit" className="bags-admin-btn primary">
              Create assignment
            </button>
          </Form>
        </BagsCard>

        <BagsCard title={`Assignments (${assignments.length})`} style={{ marginTop: 16 }}>
          {assignments.length === 0 ? (
            <p className="bags-admin-muted">No assignments yet.</p>
          ) : (
            <table className="bags-admin-table">
              <thead>
                <tr>
                  <th>Assignee</th>
                  <th>Design</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.assigneeName}</strong>
                      {a.assigneeEmail ? <div className="bags-admin-muted">{a.assigneeEmail}</div> : null}
                    </td>
                    <td>
                      {a.designName}
                      {a.staffSheet ? <div className="bags-admin-muted">Staff sheet</div> : null}
                    </td>
                    <td>{a.status}</td>
                    <td>{a.notes || "—"}</td>
                    <td>{new Date(a.updatedAt).toLocaleString()}</td>
                    <td>
                      <div className="bags-admin-actions">
                        {a.status === "pending" ? (
                          <Form method="post">
                            <input type="hidden" name="intent" value="complete" />
                            <input type="hidden" name="assignmentId" value={a.id} />
                            <button type="submit" className="bags-admin-btn ghost">
                              Complete
                            </button>
                          </Form>
                        ) : (
                          <Form method="post">
                            <input type="hidden" name="intent" value="reopen" />
                            <input type="hidden" name="assignmentId" value={a.id} />
                            <button type="submit" className="bags-admin-btn ghost">
                              Reopen
                            </button>
                          </Form>
                        )}
                        <Form method="post">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="assignmentId" value={a.id} />
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
          )}
        </BagsCard>
      </div>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

import { describe, expect, it } from "vitest";
import { readAppProxyCustomerFromRequest } from "../app/domain/security/app-proxy-customer";

describe("readAppProxyCustomerFromRequest", () => {
  it("reads customer ID from signed logged_in_customer_id param", () => {
    const request = new Request(
      "https://app.example/apps/legends-bags/session?shop=legends-bags-in2lwdll.myshopify.com&logged_in_customer_id=998877&customerName=Alex+Rivera&customerEmail=alex%40example.com&customerKey=gid%3A%2F%2Fshopify%2FCustomer%2F998877",
    );
    const identity = readAppProxyCustomerFromRequest(request);
    expect(identity.customerKey).toBe("gid://shopify/Customer/998877");
    expect(identity.customerName).toBe("Alex Rivera");
    expect(identity.customerEmail).toBe("alex@example.com");
  });

  it("returns guest when logged_in_customer_id is blank", () => {
    const request = new Request(
      "https://app.example/apps/legends-bags/session?shop=legends-bags-in2lwdll.myshopify.com&logged_in_customer_id=",
    );
    const identity = readAppProxyCustomerFromRequest(request);
    expect(identity.customerKey).toBeNull();
    expect(identity.customerName).toBeNull();
  });

  it("rejects mismatched unsigned customerKey vs signed logged_in_customer_id", () => {
    const request = new Request(
      "https://app.example/apps/legends-bags/session?logged_in_customer_id=1&customerKey=gid%3A%2F%2Fshopify%2FCustomer%2F999&customerName=Attacker",
    );
    const identity = readAppProxyCustomerFromRequest(request);
    expect(identity.customerKey).toBe("gid://shopify/Customer/1");
    expect(identity.customerName).toBeNull();
    expect(identity.customerEmail).toBeNull();
  });
});

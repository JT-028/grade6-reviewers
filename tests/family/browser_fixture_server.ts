const root = new URL("../../", import.meta.url);
const children: { id: string; display_name: string; archived: boolean }[] = [];
const devices: {
  id: string;
  label: string;
  approved_at: string;
  expires_at: string;
  revoked_at: string | null;
  child_ids: string[];
}[] = [];
const pairs = new Map<string, { id: string; device_label: string; approved: boolean }>();
const childId = "20000000-0000-4000-8000-000000000001";
const deviceId = "40000000-0000-4000-8000-000000000001";
const token = "a".repeat(64);
const expiry = () => new Date(Date.now() + 8 * 3600000).toISOString();
const response = (body: Record<string, unknown>, status = 200) =>
  Response.json({
    ...body,
    api_version: 1,
    server_time: new Date().toISOString(),
    request_id: crypto.randomUUID(),
  }, { status, headers: { "Cache-Control": "no-store" } });
Deno.serve({ hostname: "127.0.0.1", port: 8766 }, async (request) => {
  const path = new URL(request.url).pathname;
  if (path === "/auth/v1/token") {
    return Response.json({
      access_token: "fixture-parent",
      refresh_token: "fixture-refresh",
      expires_in: 3600,
    });
  }
  if (path === "/auth/v1/logout") return new Response(null, { status: 204 });
  if (path.startsWith("/functions/v1/family-api/v1")) {
    const endpoint = path.slice("/functions/v1/family-api/v1".length);
    const body = request.method === "GET" ? {} : await request.json();
    if (endpoint === "/parent/family") {
      return response({ timezone: "Asia/Manila", children, devices });
    }
    if (endpoint === "/parent/children" && request.method === "POST") {
      const profile = {
        id: children.length ? crypto.randomUUID() : childId,
        display_name: body.display_name,
        archived: false,
      };
      children.push(profile);
      return response({ child: profile }, 201);
    }
    if (endpoint.startsWith("/parent/children/") && request.method === "PATCH") {
      const profile = children.find((c) => endpoint.endsWith(c.id));
      if (!profile) return response({ error: { message: "Profile not found" } }, 404);
      if (body.display_name) profile.display_name = body.display_name;
      if ("archived" in body) profile.archived = body.archived;
      return response({ child: profile });
    }
    if (endpoint === "/pair-requests") {
      pairs.set(body.request_id, {
        id: body.request_id,
        device_label: body.device_label,
        approved: false,
      });
      return response({
        request_id: body.request_id,
        approval_code: "ABCDABCDABCDABCD",
        expires_at: new Date(Date.now() + 600000).toISOString(),
      }, 201);
    }
    if (endpoint === "/parent/pair-approvals") {
      const pair = Array.from(pairs.values()).find((p) => !p.approved);
      if (!pair) return response({ error: { message: "No pairing request" } }, 404);
      pair.approved = true;
      devices.push({
        id: deviceId,
        label: pair.device_label,
        approved_at: new Date().toISOString(),
        expires_at: expiry(),
        revoked_at: null,
        child_ids: body.child_ids,
      });
      return response({ device_id: deviceId, status: "approved" });
    }
    if (/^\/pair-requests\/[^/]+\/claim$/.test(endpoint)) {
      const pair = pairs.get(endpoint.split("/")[2]);
      return pair?.approved
        ? response({
          status: "approved",
          device_id: deviceId,
          device_token: token,
          expires_at: expiry(),
        })
        : response({ status: "pending" });
    }
    if (endpoint === "/device/children") {
      return response({
        device_id: deviceId,
        expires_at: expiry(),
        children: children.filter((c) => devices[0]?.child_ids.includes(c.id)),
      });
    }
    if (endpoint === "/child/unlock") {
      if (body.pin !== "123456") {
        return response({ error: { message: "The profile or PIN is incorrect." } }, 401);
      }
      return response({
        child_session_token: "b".repeat(64),
        child_session_id: crypto.randomUUID(),
        expires_at: expiry(),
        child: children.find((c) => c.id === body.child_id),
        cache_key: "c".repeat(64),
        bootstrap: {},
      });
    }
    if (endpoint === "/child/bootstrap") {
      return response({ child: children[0], capabilities: ["family_access"] });
    }
    if (endpoint === "/child/lock") return response({ locked: true });
    return response({ error: { message: "Fixture endpoint unavailable." } }, 404);
  }
  if (path === "/__family_m1_fixture__.html") {
    let html = await Deno.readTextFile(new URL("family.html", root));
    html = html.replace("const FAMILY_ENABLED = false;", "const FAMILY_ENABLED = true;")
      .replace(
        /const FAMILY_SUPABASE_URL = ["'][^"']+["'];/,
        'const FAMILY_SUPABASE_URL = "http://127.0.0.1:8766";',
      )
      .replace(/const ready\s*=[\s\S]*?;/, "const ready = FAMILY_ENABLED;")
      .replace(
        "<body>",
        '<body><aside style="background:#f5d88a;padding:8px;text-align:center">Local test fixture · Synthetic profiles · No cloud requests</aside>',
      );
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  const filename = path === "/" ? "index.html" : path.slice(1);
  if (!/^[a-zA-Z0-9_]+\.html$/.test(filename)) return new Response("Not found", { status: 404 });
  try {
    return new Response(await Deno.readFile(new URL(filename, root)), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
});

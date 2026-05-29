// functions/api/admin-media.js
import { createClient } from "../../lib/supabase.js";

function unauthorized() {
  return new Response(JSON.stringify({ error: "Não autorizado" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequest({ request, env }) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const headers = { "Content-Type": "application/json" };
  const url = new URL(request.url);

  const secret =
    request.headers.get("x-admin-secret") ||
    url.searchParams.get("secret");

  if (secret !== env.ADMIN_SECRET) return unauthorized();

  // GET → lista todas as mídias
  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("medias")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers });
    return new Response(JSON.stringify(data), { status: 200, headers });
  }

  // POST → adiciona uma mídia
  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch {
      return new Response('{"error":"JSON inválido"}', { status: 400, headers });
    }

    const { url: mediaUrl, thumbnail, type, title, is_free } = body;
    if (!mediaUrl || !type) {
      return new Response(JSON.stringify({ error: "url e type são obrigatórios" }), { status: 400, headers });
    }

    const { data, error } = await supabase
      .from("medias")
      .insert({ url: mediaUrl, thumbnail: thumbnail || null, type, title: title || null, is_free: !!is_free })
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers });
    return new Response(JSON.stringify(data), { status: 201, headers });
  }

  // DELETE → remove uma mídia por ID
  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return new Response('{"error":"id ausente"}', { status: 400, headers });

    const { error } = await supabase.from("medias").delete().eq("id", id);
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers });
    return new Response(JSON.stringify({ deleted: true }), { status: 200, headers });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

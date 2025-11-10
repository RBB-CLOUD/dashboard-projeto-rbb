import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req) => {
  try {
    const { projectName, repo } = await req.json()
    const token = Deno.env.get("https://console.radiobusinessbrasil.com.br")

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Faltando VERCEL_TOKEN nas Secrets" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const response = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: projectName,
        target: "production",
        gitSource: {
          type: "github",
          repo,
          ref: "main"
        }
      })
    })

    const data = await response.json()

    return new Response(
      JSON.stringify({
        ok: true,
        project: projectName,
        url: `https://${data?.url || "aguardando.vercel.app"}`
      }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

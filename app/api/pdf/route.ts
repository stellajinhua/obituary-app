export async function GET() {
  return new Response("ok");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed" }), {
      status: 500,
    });
  }
}
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.rpc("cleanup_old_cases");

    if (error) {
      console.error("Cleanup error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (err: any) {
  console.error("Unexpected error:", err);
  return new Response(JSON.stringify({ error: err.message }), {
    status: 500,
  });
}
}
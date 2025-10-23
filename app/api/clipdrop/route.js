import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { removeBackground } from "@/lib/clipdrop";

export async function POST(req) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ success: false, error: "Missing imageBase64" }, { status: 400 });
    }

    const processed = await removeBackground(imageBase64);
    if (!processed) {
      return NextResponse.json({ success: false, error: "Clipdrop failed" }, { status: 500 });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const fileName = `clipdrop-${Date.now()}.png`;
    const base64Data = processed.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(`clipdrop/${fileName}`, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error", uploadError);
      return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
    }

    const { data } = supabase.storage.from("images").getPublicUrl(`clipdrop/${fileName}`);
    return NextResponse.json({ success: true, publicUrl: data.publicUrl });
  } catch (err) {
    console.error("API clipdrop route error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

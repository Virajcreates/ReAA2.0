import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    let fileName = formData.get('fileName') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided in request.' },
        { status: 400 }
      );
    }

    if (!fileName) {
      const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      fileName = `${Date.now()}_${cleanBaseName}.pdf`;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase storage credentials not configured on server.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('temp_documents')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Server upload error to temp_documents:', uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const targetPath = uploadData?.path || fileName;
    const { data: urlData } = supabase.storage
      .from('temp_documents')
      .getPublicUrl(targetPath);

    let fileUrl = urlData?.publicUrl || '';

    if (!fileUrl) {
      const { data: signedData } = await supabase.storage
        .from('temp_documents')
        .createSignedUrl(targetPath, 3600);
      fileUrl = signedData?.signedUrl || '';
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      path: targetPath,
    });
  } catch (error: any) {
    console.error('Fatal error in /api/upload route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during upload.' },
      { status: 500 }
    );
  }
}

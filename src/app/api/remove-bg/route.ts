import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

if (!REMOVE_BG_API_KEY) {
  throw new Error('REMOVE_BG_API_KEY environment variable is not set');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image_file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '请上传图片文件' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '请上传 JPG、PNG 或 WEBP 格式的图片' },
        { status: 400 }
      );
    }

    // Validate file size (12MB limit from remove.bg)
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json(
        { error: '图片大小不能超过 12MB' },
        { status: 400 }
      );
    }

    // Convert file to Blob for remove.bg API
    const imageBuffer = await file.arrayBuffer();

    // Call remove.bg API
    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', new Blob([imageBuffer]), file.name);
    removeBgFormData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: removeBgFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API 密钥无效' },
          { status: 401 }
        );
      }

      if (response.status === 402) {
        return NextResponse.json(
          { error: 'API 额度已用尽，请稍后重试' },
          { status: 402 }
        );
      }

      if (response.status === 415) {
        return NextResponse.json(
          { error: '图片格式不支持' },
          { status: 415 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: '请求过于频繁，请稍后重试' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `处理失败: ${errorText || '未知错误'}` },
        { status: response.status }
      );
    }

    // Get the processed image as blob
    const blob = await response.blob();

    // Return the processed image
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="removed-bg.png"',
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: '处理失败，请稍后重试' },
      { status: 500 }
    );
  }
}

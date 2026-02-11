import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { authOptions } from '@/lib/auth';
import {
  isS3Configured,
  getPresignedPutUrl,
} from '@/lib/s3';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'];

function getExtFromFilename(filename: string): string | null {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : null;
  return ext && ALLOWED_EXTS.includes(ext) ? ext : null;
}

function getExtFromContentType(contentType: string): string | null {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[contentType] ?? null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isS3Configured()) {
    return NextResponse.json(
      { error: 'File upload is not configured.' },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const { contentType, filename } = body as {
      contentType?: string;
      filename?: string;
    };
    if (
      !contentType ||
      typeof contentType !== 'string' ||
      !filename ||
      typeof filename !== 'string'
    ) {
      return NextResponse.json(
        { error: 'contentType and filename are required.' },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP.' },
        { status: 400 }
      );
    }
    const ext =
      getExtFromContentType(contentType) ?? getExtFromFilename(filename);
    if (!ext) {
      return NextResponse.json(
        { error: 'Could not determine file extension.' },
        { status: 400 }
      );
    }

    const key = `avatars/${session.user.id}/${randomUUID()}.${ext}`;
    const uploadUrl = await getPresignedPutUrl(key, contentType, 60);

    return NextResponse.json({ uploadUrl, key });
  } catch (e) {
    console.error('POST /api/user/avatar/upload-url:', e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

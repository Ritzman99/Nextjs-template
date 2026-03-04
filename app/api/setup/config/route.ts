import { NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import path from 'path';
import type { ProjectConfig, TemplateSectionsConfig } from '@/types/projectConfig';

const CONFIG_FILENAME = 'project.config.json';

function getConfigPath(): string {
  return path.join(process.cwd(), CONFIG_FILENAME);
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Setup config is only available in development' },
      { status: 403 }
    );
  }
  try {
    const { readFileSync, existsSync } = await import('fs');
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
      return NextResponse.json({ config: null });
    }
    const raw = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw) as ProjectConfig;
    return NextResponse.json({ config });
  } catch (e) {
    console.error('GET /api/setup/config:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to read config' },
      { status: 500 }
    );
  }
}

function validateBody(body: unknown): body is ProjectConfig {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (b.organization !== 'full' && b.organization !== 'teams-only') return false;
  if (!b.sections || typeof b.sections !== 'object') return false;
  const s = b.sections as Record<string, unknown>;
  const keys: (keyof TemplateSectionsConfig)[] = [
    'authentication',
    'calendar',
    'contacts',
    'inbox',
    'profile',
    'docs',
    'admin',
  ];
  for (const key of keys) {
    if (typeof s[key] !== 'boolean') return false;
  }
  return true;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Setup config is only available in development' },
      { status: 403 }
    );
  }
  try {
    const body = await request.json();
    if (!validateBody(body)) {
      return NextResponse.json(
        { error: 'Invalid config: organization and sections required' },
        { status: 400 }
      );
    }
    const configPath = getConfigPath();
    const config: ProjectConfig = {
      organization: body.organization,
      sections: body.sections,
      // Keep appliedAt if present in body; do not overwrite with new date on save
      appliedAt: body.appliedAt,
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return NextResponse.json({ ok: true, config });
  } catch (e) {
    console.error('POST /api/setup/config:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to write config' },
      { status: 500 }
    );
  }
}

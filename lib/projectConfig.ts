/**
 * Read project.config.json from repo root. Used by API routes and apply script.
 * Returns null if file does not exist or is invalid.
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { ProjectConfig } from '@/types/projectConfig';

const CONFIG_FILENAME = 'project.config.json';

function getConfigPath(): string {
  return path.join(process.cwd(), CONFIG_FILENAME);
}

export function getProjectConfigPath(): string {
  return getConfigPath();
}

export function readProjectConfig(): ProjectConfig | null {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) return null;
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as ProjectConfig;
    if (!parsed.organization || !parsed.sections) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Apply template configuration: delete disabled pages/APIs and patch code for "teams-only" org.
 * Run: npm run apply-template-config
 * Reads project.config.json from project root.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, 'project.config.json');

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('project.config.json not found. Save configuration from the Setup page first.');
    process.exit(1);
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Invalid project.config.json:', e.message);
    process.exit(1);
  }
}

function rmDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    fs.unlinkSync(dir);
  } else {
    fs.rmSync(dir, { recursive: true });
  }
  console.log('  Removed:', path.relative(ROOT, dir));
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('  Patched:', path.relative(ROOT, filePath));
}

function applyTeamsOnly() {
  const companyModel = path.join(ROOT, 'models', 'Company.ts');
  const locationModel = path.join(ROOT, 'models', 'Location.ts');
  if (fs.existsSync(companyModel)) rmDirRecursive(companyModel);
  if (fs.existsSync(locationModel)) rmDirRecursive(locationModel);
  rmDirRecursive(path.join(ROOT, 'app', 'admin', 'companies'));
  rmDirRecursive(path.join(ROOT, 'app', 'admin', 'locations'));
  rmDirRecursive(path.join(ROOT, 'app', 'api', 'admin', 'companies'));
  rmDirRecursive(path.join(ROOT, 'app', 'api', 'admin', 'locations'));

  const teamModelPath = path.join(ROOT, 'models', 'Team.ts');
  if (fs.existsSync(teamModelPath)) {
    let content = fs.readFileSync(teamModelPath, 'utf-8');
    content = content
      .replace(/\s*companyId\?: mongoose\.Types\.ObjectId \| null;\s*\n/, '')
      .replace(/\s*locationId\?: mongoose\.Types\.ObjectId \| null;\s*\n/, '')
      .replace(/\s*companyId: \{ type: Schema\.Types\.ObjectId, ref: 'Company', default: null \},\s*\n/, '')
      .replace(/\s*locationId: \{ type: Schema\.Types\.ObjectId, ref: 'Location', default: null \},\s*\n/, '')
      .replace(/\s*teamSchema\.index\(\{ companyId: 1 \}\);\s*\n/, '')
      .replace(/\s*teamSchema\.index\(\{ locationId: 1 \}\);\s*\n/, '');
    writeFile(teamModelPath, content);
  }

  const adminLayoutPath = path.join(ROOT, 'app', 'admin', 'layout.tsx');
  if (fs.existsSync(adminLayoutPath)) {
    let content = fs.readFileSync(adminLayoutPath, 'utf-8');
    content = content.replace(
      /  \{\s*label: 'Organization',\s*links: \[\s*\{ href: '\/admin\/companies', label: 'Companies' \},\s*\{ href: '\/admin\/locations', label: 'Locations' \},\s*\{ href: '\/admin\/teams', label: 'Teams' \},\s*\]\s*\},/,
      "  {\n    label: 'Organization',\n    links: [{ href: '/admin/teams', label: 'Teams' }],\n  },"
    );
    writeFile(adminLayoutPath, content);
  }

  const sectionsPath = path.join(ROOT, 'lib', 'sections.ts');
  if (fs.existsSync(sectionsPath)) {
    let content = fs.readFileSync(sectionsPath, 'utf-8');
    content = content
      .replace(/\s*\{ id: 'companies', label: 'Companies', allowedActions: \['view', 'create', 'edit', 'delete', '\*'\] \},\s*\n/, '')
      .replace(/\s*\{ id: 'locations', label: 'Locations', allowedActions: \['view', 'create', 'edit', 'delete', '\*'\] \},\s*\n/, '');
    writeFile(sectionsPath, content);
  }
}

function applySectionDeletions(sections) {
  const map = {
    authentication: [path.join(ROOT, 'app', 'auth')],
    calendar: [path.join(ROOT, 'app', 'calendar'), path.join(ROOT, 'app', 'api', 'calendar')],
    contacts: [path.join(ROOT, 'app', 'contacts'), path.join(ROOT, 'app', 'api', 'contacts')],
    inbox: [path.join(ROOT, 'app', 'inbox'), path.join(ROOT, 'app', 'api', 'inbox')],
    profile: [path.join(ROOT, 'app', 'profile'), path.join(ROOT, 'app', 'api', 'user')],
    docs: [path.join(ROOT, 'app', 'docs')],
    admin: [path.join(ROOT, 'app', 'admin'), path.join(ROOT, 'app', 'api', 'admin')],
  };
  for (const [key, dirs] of Object.entries(map)) {
    if (sections[key] === false) {
      for (const dir of dirs) {
        rmDirRecursive(dir);
      }
    }
  }
}

function buildNavItems(sections) {
  const items = [{ href: '/', label: 'Home' }, { href: '/setup', label: 'Setup' }];
  if (sections.calendar) items.push({ href: '/calendar', label: 'Calendar' });
  if (sections.contacts) items.push({ href: '/contacts', label: 'Contacts' });
  if (sections.inbox) items.push({ href: '/inbox', label: 'Inbox' });
  if (sections.docs) items.push({ href: '/docs', label: 'Components' });
  return items;
}

function applyLayoutNav(items) {
  const layoutPath = path.join(ROOT, 'app', 'layout.tsx');
  if (!fs.existsSync(layoutPath)) return;
  let content = fs.readFileSync(layoutPath, 'utf-8');
  const itemsStr = items.map((i) => `  { href: "${i.href}", label: "${i.label}" }`).join(',\n');
  content = content.replace(
    /const topNavItems = \[[\s\S]*?\];/,
    `const topNavItems = [\n${itemsStr},\n];`
  );
  writeFile(layoutPath, content);
}

function main() {
  console.log('Reading project.config.json...');
  const config = readConfig();
  const { organization, sections } = config;
  if (!sections || typeof sections !== 'object') {
    console.error('Config must have sections object.');
    process.exit(1);
  }

  console.log('\nApplying organization:', organization);
  if (organization === 'teams-only') {
    applyTeamsOnly();
  }

  console.log('\nApplying section deletions...');
  applySectionDeletions(sections);

  console.log('\nUpdating root layout nav...');
  const navItems = buildNavItems(sections);
  applyLayoutNav(navItems);

  config.appliedAt = new Date().toISOString();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  console.log('\nUpdated project.config.json with appliedAt.');
  console.log('Done. Restart the dev server if it is running.');
}

main();

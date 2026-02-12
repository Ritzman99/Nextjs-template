require('dotenv/config');
const mongoose = require('mongoose');

/**
 * Sections for all admin pages (matches sidebar: Access, Organization, Support).
 * Run: npm run seed:sections
 */
const ADMIN_PAGE_SECTIONS = [
  { name: 'Users', slug: 'users', allowedActions: ['view', 'create', 'edit', 'delete', '*'] },
  { name: 'Roles', slug: 'roles', allowedActions: ['view', 'create', 'edit', 'delete', '*'] },
  { name: 'Sections', slug: 'sections', allowedActions: ['view', 'create', 'edit', 'delete', '*'] },
  { name: 'Companies', slug: 'companies', allowedActions: ['view', 'create', 'edit', 'delete', '*'] },
  { name: 'Locations', slug: 'locations', allowedActions: ['view', 'create', 'edit', 'delete', '*'] },
  { name: 'Teams', slug: 'teams', allowedActions: ['view', 'create', 'edit', 'delete', '*'] },
  { name: 'Tickets', slug: 'tickets', allowedActions: ['view', 'create', 'edit', 'delete', 'assign', '*'] },
];

async function seedSections() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nextjs';
  try {
    await mongoose.connect(uri);

    const SectionSchema = new mongoose.Schema(
      {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        allowedActions: { type: [String], default: ['view', 'create', 'edit', 'delete', '*'] },
      },
      { timestamps: true, collection: 'sections' }
    );

    const SectionModel =
      mongoose.models.Section ?? mongoose.model('Section', SectionSchema);

    let created = 0;
    let updated = 0;
    for (const s of ADMIN_PAGE_SECTIONS) {
      const result = await SectionModel.updateOne(
        { slug: s.slug },
        {
          $set: {
            name: s.name,
            slug: s.slug,
            allowedActions: s.allowedActions,
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount) created += 1;
      else if (result.modifiedCount) updated += 1;
    }

    console.log(
      `Sections seeded: ${created} created, ${updated} updated (${ADMIN_PAGE_SECTIONS.length} total).`
    );
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedSections();

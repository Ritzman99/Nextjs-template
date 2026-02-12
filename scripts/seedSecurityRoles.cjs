require('dotenv/config');
const mongoose = require('mongoose');

const roles = [
  {
    name: 'Owner',
    scopeLevel: 'company',
    permissions: [{ section: '*', actions: ['*'] }],
  },
  {
    name: 'Teacher',
    scopeLevel: 'location',
    permissions: [
      { section: 'classes', actions: ['view', 'edit', 'grade'] },
      { section: 'students', actions: ['view'] },
    ],
  },
  {
    name: 'Student',
    scopeLevel: 'team',
    permissions: [
      { section: 'classes', actions: ['view'] },
      { section: 'assignments', actions: ['submit'] },
    ],
  },
  {
    name: 'Admin',
    scopeLevel: 'global',
    permissions: [{ section: '*', actions: ['*'] }],
  },
  {
    name: 'FreeUser',
    scopeLevel: 'team',
    permissions: [
      { section: 'recipes', actions: ['view'] },
      { section: 'collections', actions: ['view'] },
    ],
  },
  {
    name: 'PremiumUser',
    scopeLevel: 'team',
    permissions: [
      { section: 'recipes', actions: ['view', 'create', 'edit'] },
      { section: 'collections', actions: ['view', 'create', 'edit'] },
    ],
  },
  {
    name: 'AdminUser',
    scopeLevel: 'global',
    permissions: [{ section: '*', actions: ['*'] }],
  },
  {
    name: 'ModeratorUser',
    scopeLevel: 'global',
    permissions: [{ section: 'recipes', actions: ['moderate', 'remove'] }],
  },
  {
    name: 'PayrollUser',
    scopeLevel: 'global',
    permissions: [{ section: 'billing', actions: ['view', 'export'] }],
  },
];

async function seedSecurityRoles() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nextjs';
  try {
    await mongoose.connect(uri);

    const PermissionConditionSchema = new mongoose.Schema(
      {
        key: { type: String, required: true },
        operator: {
          type: String,
          enum: ['eq', 'neq', 'in', 'nin', 'contains', 'exists', 'truthy'],
          default: 'eq',
        },
        value: { type: mongoose.Schema.Types.Mixed },
      },
      { _id: false }
    );

    const RolePermissionSchema = new mongoose.Schema(
      {
        section: { type: String, required: true },
        actions: { type: [String], default: [] },
        conditions: { type: [PermissionConditionSchema], default: [] },
      },
      { _id: false }
    );

    const SecurityRoleSchema = new mongoose.Schema(
      {
        name: { type: String, required: true },
        scopeLevel: { type: String, enum: ['global', 'company', 'location', 'team'], default: 'global' },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
        locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
        permissions: { type: [RolePermissionSchema], default: [] },
        metadata: { type: mongoose.Schema.Types.Mixed },
      },
      { timestamps: true, collection: 'security_roles' }
    );

    const SecurityRoleModel =
      mongoose.models.SecurityRole ??
      mongoose.model('SecurityRole', SecurityRoleSchema);

    for (const role of roles) {
      await SecurityRoleModel.findOneAndUpdate(
        { name: role.name, scopeLevel: role.scopeLevel },
        { $set: role },
        { upsert: true, new: true }
      );
    }

    console.log(`Seeded ${roles.length} security roles.`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedSecurityRoles();

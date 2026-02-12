import mongoose, { Schema, model, models } from 'mongoose';

export type ScopeLevel = 'global' | 'company' | 'location' | 'team';

export interface IPermissionCondition {
  key: string;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'contains' | 'exists' | 'truthy';
  value?: unknown;
}

export interface IRolePermission {
  section: string;
  actions: string[];
  conditions?: IPermissionCondition[];
}

export interface ISecurityRole {
  _id: mongoose.Types.ObjectId;
  name: string;
  scopeLevel: ScopeLevel;
  companyId?: mongoose.Types.ObjectId | null;
  locationId?: mongoose.Types.ObjectId | null;
  teamId?: mongoose.Types.ObjectId | null;
  permissions: IRolePermission[];
  metadata?: Record<string, unknown>;
}

const permissionConditionSchema = new Schema<IPermissionCondition>(
  {
    key: { type: String, required: true },
    operator: {
      type: String,
      enum: ['eq', 'neq', 'in', 'nin', 'contains', 'exists', 'truthy'],
      default: 'eq',
    },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    section: { type: String, required: true },
    actions: { type: [String], default: [] },
    conditions: { type: [permissionConditionSchema], default: [] },
  },
  { _id: false }
);

const securityRoleSchema = new Schema<ISecurityRole>(
  {
    name: { type: String, required: true },
    scopeLevel: { type: String, enum: ['global', 'company', 'location', 'team'], default: 'global' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', default: null },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    permissions: { type: [rolePermissionSchema], default: [] },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'security_roles' }
);

securityRoleSchema.index({ name: 1 });
securityRoleSchema.index({ scopeLevel: 1 });
securityRoleSchema.index({ companyId: 1, locationId: 1, teamId: 1 });

const SecurityRoleModel =
  models?.SecurityRole ?? model<ISecurityRole>('SecurityRole', securityRoleSchema);
export default SecurityRoleModel;

import mongoose, { Schema, model, models } from 'mongoose';

export interface ITeam {
  _id: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId | null;
  locationId?: mongoose.Types.ObjectId | null;
  name: string;
  type?: string;
  status?: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, unknown>;
}

const teamSchema = new Schema<ITeam>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', default: null },
    name: { type: String, required: true },
    type: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'teams' }
);

teamSchema.index({ companyId: 1 });
teamSchema.index({ locationId: 1 });

const TeamModel = models?.Team ?? model<ITeam>('Team', teamSchema);
export default TeamModel;

import mongoose, { Schema, model, models } from 'mongoose';

export interface ILocation {
  _id: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId | null;
  name: string;
  code?: string;
  status?: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, unknown>;
}

const locationSchema = new Schema<ILocation>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    name: { type: String, required: true },
    code: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'locations' }
);

locationSchema.index({ companyId: 1 });
locationSchema.index({ companyId: 1, code: 1 });

const LocationModel = models?.Location ?? model<ILocation>('Location', locationSchema);
export default LocationModel;

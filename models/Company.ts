import mongoose, { Schema, model, models } from 'mongoose';

export interface ICompany {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug?: string;
  status?: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, unknown>;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'companies' }
);

companySchema.index({ name: 1 });

const CompanyModel = models?.Company ?? model<ICompany>('Company', companySchema);
export default CompanyModel;

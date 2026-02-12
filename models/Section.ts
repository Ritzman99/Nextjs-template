import mongoose, { Schema, model, models } from 'mongoose';

const DEFAULT_ALLOWED_ACTIONS = ['view', 'create', 'edit', 'delete', '*'];

export interface ISection {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  allowedActions: string[];
}

const sectionSchema = new Schema<ISection>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    allowedActions: {
      type: [String],
      default: DEFAULT_ALLOWED_ACTIONS,
    },
  },
  { timestamps: true, collection: 'sections' }
);

sectionSchema.index({ name: 1 });

const SectionModel = models?.Section ?? model<ISection>('Section', sectionSchema);
export default SectionModel;

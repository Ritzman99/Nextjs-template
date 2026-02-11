require('dotenv/config');
const mongoose = require('mongoose');
const { hash } = require('bcryptjs');

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'asdf';

async function seedAdmin() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nextjs';
  try {
    await mongoose.connect(uri);
    const UserSchema = new mongoose.Schema(
      {
        userId: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        name: { type: String },
        role: { type: String, default: 'user' },
      },
      { timestamps: true, collection: 'user_profiles' }
    );
    const UserModel =
      mongoose.models.User ?? mongoose.model('User', UserSchema);

    const userId = new mongoose.Types.ObjectId().toString();
    const hashedPassword = await hash(ADMIN_PASSWORD, 12);

    await UserModel.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $set: {
          userId,
          email: ADMIN_EMAIL,
          password: hashedPassword,
          name: 'Admin',
          role: 'admin',
        },
      },
      { upsert: true, new: true }
    );

    console.log(
      `Admin user seeded: ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD})`
    );
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();

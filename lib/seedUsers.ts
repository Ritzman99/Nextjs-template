import mongoose from 'mongoose';
import { hash } from 'bcryptjs';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';
import SecurityRoleModel from '@/models/SecurityRole';
import TeamModel from '@/models/Team';

export interface SeedUsersOptions {
  roleCounts: Record<string, number>;
  defaultPassword?: string;
}

export async function seedUsers(options: SeedUsersOptions): Promise<{ created: number }> {
  const { roleCounts, defaultPassword = 'password' } = options;
  await connect();

  const roleNames = Object.keys(roleCounts).filter((name) => roleCounts[name] > 0);
  if (roleNames.length === 0) {
    return { created: 0 };
  }

  const roles = (await SecurityRoleModel.find({ name: { $in: roleNames } }).lean()) as unknown as Array<{
    _id: mongoose.Types.ObjectId;
    name: string;
  }>;
  const roleIdByName = new Map<string, mongoose.Types.ObjectId>();
  for (const r of roles) {
    roleIdByName.set(r.name, r._id);
  }

  let firstTeamId: mongoose.Types.ObjectId | null = null;
  try {
    const team = (await TeamModel.findOne({}).lean()) as unknown as { _id: mongoose.Types.ObjectId } | null;
    if (team?._id) {
      firstTeamId = team._id;
    }
  } catch {
    // no teams
  }

  const hashedPassword = await hash(defaultPassword, 12);
  let created = 0;

  for (const roleName of roleNames) {
    const count = Math.min(100, Math.max(0, Math.floor(Number(roleCounts[roleName]) || 0)));
    const securityRoleId = roleIdByName.get(roleName);
    if (!securityRoleId) {
      continue; // skip unknown role
    }

    for (let i = 0; i < count; i++) {
      const base = roleName === 'Admin' && count === 1 ? 'admin' : `${roleName.toLowerCase()}${i + 1}`;
      const email = `${base}@example.com`;
      const existing = await UserModel.findOne({ email }).lean();
      if (existing) continue;

      const userId = new mongoose.Types.ObjectId().toString();
      await UserModel.create({
        userId,
        email,
        password: hashedPassword,
        name: `${roleName} ${i + 1}`,
        role: roleName === 'Admin' ? 'admin' : 'user',
        securityRoleId,
        teamId: firstTeamId ?? undefined,
        roleAssignments: [
          {
            securityRoleId,
            active: true,
          },
        ],
      });
      created += 1;
    }
  }

  return { created };
}

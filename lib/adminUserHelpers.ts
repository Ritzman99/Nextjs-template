import type { IUser } from '@/models/User';
import type { User } from '@/types/user';
import { isS3Configured, getAvatarSignedUrl } from '@/lib/s3';

type ProfileDoc = Pick<
  IUser,
  | 'userId'
  | 'email'
  | 'name'
  | 'image'
  | 'avatar'
  | 'avatarKey'
  | 'role'
  | 'companyId'
  | 'locationId'
  | 'teamId'
  | 'securityRoleId'
  | 'roleAssignments'
  | 'firstName'
  | 'lastName'
  | 'gender'
  | 'address'
  | 'age'
  | 'username'
  | 'region'
  | 'state'
  | 'timezone'
>;

function toIdString(value?: { toString(): string } | string | null): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.toString();
}

export async function profileToSafeUser(
  doc: ProfileDoc,
  options?: { resolveAvatar?: boolean }
): Promise<User> {
  const cdnUrl = process.env.NEXT_PUBLIC_AVATAR_CDN_URL;
  let avatar: string | null = doc.avatar ?? doc.image ?? null;
  if (options?.resolveAvatar && doc.avatarKey) {
    if (cdnUrl) avatar = `${cdnUrl}/${doc.avatarKey}`;
    else if (isS3Configured()) avatar = await getAvatarSignedUrl(doc.avatarKey, 3600);
  }
  return {
    id: doc.userId,
    name: doc.name ?? null,
    email: doc.email,
    role: doc.role ?? 'user',
    avatar,
    companyId: toIdString(doc.companyId),
    locationId: toIdString(doc.locationId),
    teamId: toIdString(doc.teamId),
    securityRoleId: toIdString(doc.securityRoleId),
    roleAssignments: doc.roleAssignments?.flatMap((assignment) => {
      const securityRoleId = toIdString(assignment.securityRoleId);
      if (!securityRoleId) return [];
      return [
        {
          securityRoleId,
          companyId: toIdString(assignment.companyId),
          locationId: toIdString(assignment.locationId),
          teamId: toIdString(assignment.teamId),
          active: assignment.active ?? true,
          overrides: assignment.overrides ?? undefined,
        },
      ];
    }),
    firstName: doc.firstName ?? null,
    lastName: doc.lastName ?? null,
    gender: doc.gender ?? null,
    address: doc.address ?? null,
    age: doc.age ?? null,
    username: doc.username ?? null,
    region: doc.region ?? null,
    state: doc.state ?? null,
    timezone: doc.timezone ?? null,
  };
}

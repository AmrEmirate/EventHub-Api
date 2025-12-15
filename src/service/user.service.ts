import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/password.helper";

const userRepository = new UserRepository();

export const getUserProfile = async (userId: string) => {
  const user = await userRepository.findByIdWithProfile(userId);
  if (!user) return null;

  // Filter sensitive data manually since we are not using Prisma 'select'
  const { password, ...safeUser } = user;
  return safeUser;
};

type UpdateProfileInput = {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
};

export const updateUserProfile = async (
  userId: string,
  data: UpdateProfileInput
) => {
  const { name, bio, avatarUrl, phone } = data;

  // Since repository update is simple, we might need to structure data for nested profile update
  // The repository currently takes generic UserUpdateInput.
  // We can pass the same structure as before.
  const updateData = {
    name: name,
    phone: phone,
    profile: {
      upsert: {
        create: { bio, avatarUrl },
        update: { bio, avatarUrl },
      },
    },
  };

  const updatedUser = await userRepository.updateWithProfile(
    userId,
    updateData
  );

  const { password, ...safeUser } = updatedUser;
  return safeUser;
};

export const changeUserPassword = async (
  userId: string,
  oldPass: string,
  newPass: string
) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  const isOldPasswordValid = await comparePassword(oldPass, user.password);
  if (!isOldPasswordValid) {
    throw new Error("Password lama tidak sesuai.");
  }

  const newHashedPassword = await hashPassword(newPass);

  await userRepository.update(userId, { password: newHashedPassword });

  return { message: "Password berhasil diperbarui." };
};

export const addPointsToUser = async (userId: string, pointsToAdd: number) => {
  try {
    const updatedUser = await userRepository.update(userId, {
      points: {
        increment: pointsToAdd,
      },
      pointsLastUpdatedAt: new Date(),
    });
    return updatedUser;
  } catch (error) {
    console.error(
      `Gagal menambahkan ${pointsToAdd} poin untuk user ${userId}:`,
      error
    );
    throw new Error("Gagal memperbarui poin pengguna.");
  }
};

export const updateUserAvatar = async (userId: string, avatarPath: string) => {
  const updateData = {
    profile: {
      upsert: {
        create: { avatarUrl: avatarPath },
        update: { avatarUrl: avatarPath },
      },
    },
  };

  const updatedUser = await userRepository.updateWithProfile(
    userId,
    updateData
  );
  const { password, ...safeUser } = updatedUser;
  return safeUser;
};

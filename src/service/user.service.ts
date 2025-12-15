import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/password.helper";

type UpdateProfileInput = {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
};

class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public async getUserProfile(userId: string) {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user) return null;

    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async updateUserProfile(userId: string, data: UpdateProfileInput) {
    const { name, bio, avatarUrl, phone } = data;

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

    const updatedUser = await this.userRepository.updateWithProfile(
      userId,
      updateData
    );

    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }

  public async changeUserPassword(
    userId: string,
    oldPass: string,
    newPass: string
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User tidak ditemukan.");
    }

    const isOldPasswordValid = await comparePassword(oldPass, user.password);
    if (!isOldPasswordValid) {
      throw new Error("Password lama tidak sesuai.");
    }

    const newHashedPassword = await hashPassword(newPass);

    await this.userRepository.update(userId, { password: newHashedPassword });

    return { message: "Password berhasil diperbarui." };
  }

  public async addPointsToUser(userId: string, pointsToAdd: number) {
    try {
      const updatedUser = await this.userRepository.update(userId, {
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
  }

  public async updateUserAvatar(userId: string, avatarPath: string) {
    const updateData = {
      profile: {
        upsert: {
          create: { avatarUrl: avatarPath },
          update: { avatarUrl: avatarPath },
        },
      },
    };

    const updatedUser = await this.userRepository.updateWithProfile(
      userId,
      updateData
    );
    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }
}

export { UserService };

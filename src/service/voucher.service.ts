import { VoucherRepository } from "../repositories/voucher.repository";
import { EventRepository } from "../repositories/event.repository";

class VoucherService {
  private voucherRepository: VoucherRepository;
  private eventRepository: EventRepository;

  constructor() {
    this.voucherRepository = new VoucherRepository();
    this.eventRepository = new EventRepository();
  }

  /**
   * [DIUBAH] Mengambil voucher pengguna beserta detail event jika ada.
   */
  public async getVouchersByUserId(userId: string) {
    const vouchers = await this.voucherRepository.findMany({
      where: {
        userId: userId,
        isUsed: false, // Tampilkan hanya yang belum dipakai
        expiresAt: {
          gte: new Date(), // Hanya yang masih berlaku
        },
      },
      include: {
        // Sertakan data nama event jika voucher ini terikat pada suatu event
        event: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });
    return vouchers;
  }

  /**
   * Membuat voucher hadiah untuk pengguna baru yang mendaftar via referral.
   */
  public async createVoucherForNewUser(userId: string) {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    const voucherCode = `WELCOME-${randomSuffix}`;

    try {
      const newVoucher = await this.voucherRepository.create({
        userId: userId,
        code: voucherCode,
        discountPercent: 10,
        expiresAt: threeMonthsFromNow,
        isUsed: false,
      });
      return newVoucher;
    } catch (error) {
      console.error(
        `Gagal membuat voucher selamat datang untuk user ${userId}:`,
        error
      );
      throw new Error("Gagal membuat voucher untuk pengguna baru.");
    }
  }

  /**
   * Membuat voucher oleh organizer untuk event spesifik.
   */
  public async createOrganizerVoucher(
    organizerId: string,
    data: {
      eventId: string;
      code: string;
      discountPercent: number;
      maxDiscount?: number | null;
      expiresAt: Date;
    }
  ) {
    const event = await this.eventRepository.findFirst({
      where: {
        id: data.eventId,
        organizerId: organizerId,
      },
    });

    if (!event) {
      throw new Error(
        "Event tidak ditemukan atau Anda tidak memiliki akses ke event ini."
      );
    }

    const existingCode = await this.voucherRepository.findFirst({
      where: { code: data.code.toUpperCase() },
    });
    if (existingCode) {
      throw new Error(
        "Kode voucher ini sudah digunakan. Harap gunakan kode lain."
      );
    }

    return await this.voucherRepository.create({
      eventId: data.eventId,
      code: data.code.toUpperCase(),
      discountPercent: data.discountPercent,
      maxDiscount: data.maxDiscount,
      expiresAt: data.expiresAt,
      isUsed: false,
    });
  }
}

export { VoucherService };

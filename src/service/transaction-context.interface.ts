import { EventRepository } from "../repositories/event.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { UserRepository } from "../repositories/user.repository";
import { VoucherRepository } from "../repositories/voucher.repository";
import { NotificationService } from "./notification.service";

export interface ITransactionContext {
  transactionRepository: TransactionRepository;
  eventRepository: EventRepository;
  userRepository: UserRepository;
  voucherRepository: VoucherRepository;
  notificationService: NotificationService;
}

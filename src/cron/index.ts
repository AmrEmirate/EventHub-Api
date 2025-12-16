import ExpireTransactionsJob from "./expire-transactions";
import ExpirePointsJob from "./expire-points";
import CancelPendingConfirmationsJob from "./cancel-pending-confirmations";

class CronJobs {
  public start(): void {
    console.log("📅 Cron jobs initialized");
  }

  public getExpireTransactionsHandler() {
    return ExpireTransactionsJob;
  }

  public getExpirePointsHandler() {
    return ExpirePointsJob;
  }

  public getCancelPendingConfirmationsHandler() {
    return CancelPendingConfirmationsJob;
  }
}

export default new CronJobs();

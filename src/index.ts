import App from "./app";
import CronJobs from "./cron";

const main = () => {
  const server = new App();
  const cronJobs = CronJobs;

  server.start();
  cronJobs.start();
};

main();

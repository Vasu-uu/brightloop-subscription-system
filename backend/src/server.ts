import "dotenv/config";
import { app } from "./app";
import { startBillingScheduler } from "./services/scheduler.service";

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  startBillingScheduler();
});

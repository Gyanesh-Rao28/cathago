import cron from "node-cron";
import DB from "../db.js";
import { logger } from "./logger.js";

// Schedule credit reset at midnight (00:00)
export const scheduleCreditReset = () => {
  logger.info("Credit reset scheduler initialized");

  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        logger.info("Starting daily credit reset");

        // Begin transaction
        DB.run("BEGIN TRANSACTION", async (err) => {
          if (err) {
            logger.error("Error starting transaction:", err);
            return;
          }

          try {
            // Update all non-admin users' credits to 20
            const result = await new Promise((resolve, reject) => {
              DB.run(
                `UPDATE users 
               SET credits = 20, 
                   last_reset = CURRENT_TIMESTAMP 
               WHERE role != 'admin'`,
                function (err) {
                  if (err) reject(err);
                  else resolve(this.changes);
                }
              );
            });

            // Commit transaction
            DB.run("COMMIT", (err) => {
              if (err) {
                logger.error("Error committing transaction:", err);
                DB.run("ROLLBACK");
                return;
              }
              logger.info(`Credits reset successful. ${result} users updated.`);
            });
          } catch (error) {
            logger.error("Error during credit reset:", error);
            DB.run("ROLLBACK");
          }
        });
      } catch (error) {
        logger.error("Credit reset scheduler error:", error);
      }
    },
    {
      scheduled: true,
      timezone: "UTC", // Adjust timezone as needed
    }
  );

  logger.info("Credit reset scheduler started");
};

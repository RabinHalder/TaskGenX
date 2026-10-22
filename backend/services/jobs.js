const payments = require("./payments");

let running = false;

// Every 30 seconds: check pending deposits and processing withdrawals.
function init() {
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await payments.pollPending();
    } catch (e) {
      console.error("Polling job error:", e.message);
    } finally {
      running = false;
    }
  }, 30 * 1000);
}

module.exports = { init };

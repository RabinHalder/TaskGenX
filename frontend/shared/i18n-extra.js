/* TaskGenX: extra texts and server-message translations */
(function () {
  "use strict";

  I18n.extend({ "tx.referral": "Referral reward" }, { "tx.referral": "রেফারেল পুরস্কার" });

  const exact = {
    "This task is not available for your level": "এই টাস্ক আপনার লেভেলের জন্য নয়",
    "You have already completed this task": "আপনি এই টাস্ক ইতিমধ্যে সম্পন্ন করেছেন",
  };

  const rules = [
    [
      /^Monthly withdrawal limit reached: (\d+) per month at your level$/,
      (n) => `আপনার লেভেলে মাসে সর্বোচ্চ ${n}টি উইথড্র করা যায়। এই মাসের সীমা শেষ হয়েছে`,
    ],
  ];

  const base = I18n.serverMessage;

  I18n.serverMessage = function (msg) {
    msg = String(msg || "");
    if (I18n.lang() === "bn") {
      if (exact[msg]) return exact[msg];
      for (const [rx, fn] of rules) {
        const m = msg.match(rx);
        if (m) return fn(...m.slice(1));
      }
    }
    return base(msg);
  };
})();

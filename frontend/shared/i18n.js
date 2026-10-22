/* TaskGenX i18n: English (default) + Bangla */
(function () {
  "use strict";

  const dict = { en: {}, bn: {} };
  let lang = "en";
  try {
    const saved = localStorage.getItem("tgx_lang");
    if (saved === "en" || saved === "bn") lang = saved;
  } catch (e) {}
  document.documentElement.lang = lang;

  function extend(en, bn) {
    Object.assign(dict.en, en || {});
    Object.assign(dict.bn, bn || {});
  }

  function t(key, vars) {
    let s = dict[lang] && dict[lang][key];
    if (s === undefined) s = dict.en[key];
    if (s === undefined) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    }
    return s;
  }

  // Choose between an English and a Bangla value coming from the server.
  function pick(en, bn) {
    return lang === "bn" && bn ? bn : en || "";
  }

  // For objects shaped like { en: "...", bn: "..." }
  function loc(obj) {
    return obj ? pick(obj.en, obj.bn) : "";
  }

  function levelName(level) {
    return level ? pick(level.name, level.nameBn) : "";
  }

  // Replaces text of elements marked with data-i18n / data-i18n-ph / data-i18n-title
  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
  }

  function setLang(next) {
    if (next !== "en" && next !== "bn") return;
    const changed = next !== lang;
    lang = next;
    try {
      localStorage.setItem("tgx_lang", lang);
    } catch (e) {}
    document.documentElement.lang = lang;
    apply(document);
    if (changed) window.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  /* ---------- Server error messages (English from the server -> Bangla) ---------- */

  const SERVER_EXACT = {
    "Invalid Telegram session": "টেলিগ্রাম সেশন সঠিক নয়",
    "Your account is banned": "আপনার অ্যাকাউন্ট ব্যান করা হয়েছে",
    "Too many requests, slow down": "অনেক বেশি অনুরোধ, একটু ধীরে করুন",
    "Something went wrong": "কিছু একটা ভুল হয়েছে",
    "Not found": "পাওয়া যায়নি",
    "Daily check-in is disabled": "দৈনিক চেক-ইন এখন বন্ধ আছে",
    "You already checked in today": "আপনি আজ ইতিমধ্যে চেক-ইন করেছেন",
    "Invalid UPI ID (example: name@bank)": "UPI আইডি সঠিক নয় (যেমন: name@bank)",
    "Invalid FINZO Wallet ID": "FINZO ওয়ালেট আইডি সঠিক নয়",
    "Task not found": "টাস্ক পাওয়া যায়নি",
    "This task has expired": "এই টাস্কের মেয়াদ শেষ হয়ে গেছে",
    "You have reached the limit for this task": "এই টাস্কে আপনার সীমা শেষ হয়ে গেছে",
    "Please upload a screenshot as proof": "প্রমাণ হিসেবে একটি স্ক্রিনশট আপলোড করুন",
    "Only JPG or PNG images are allowed": "শুধু JPG বা PNG ছবি দেওয়া যাবে",
    "This screenshot has already been used": "এই স্ক্রিনশট আগেই ব্যবহার করা হয়েছে",
    "This task is full or no longer available": "এই টাস্ক পূর্ণ হয়ে গেছে বা আর পাওয়া যাচ্ছে না",
    "Could not save your proof. Please try again.": "প্রমাণ সেভ করা যায়নি। আবার চেষ্টা করুন।",
    "Image is too large": "ছবিটি অনেক বড়",
    "Upload failed": "আপলোড ব্যর্থ হয়েছে",
    "Deposits are currently disabled": "ডিপোজিট এখন বন্ধ আছে",
    "Too many open deposits. Please wait a few minutes.": "অনেকগুলো ডিপোজিট খোলা আছে। কয়েক মিনিট অপেক্ষা করুন।",
    "Amount is too small": "পরিমাণ খুব কম",
    "Could not start the payment. Please try again.": "পেমেন্ট শুরু করা যায়নি। আবার চেষ্টা করুন।",
    "Withdrawals are currently disabled": "উইথড্র এখন বন্ধ আছে",
    "Invalid withdraw method": "উইথড্র পদ্ধতি সঠিক নয়",
    "UPI withdrawal is disabled": "UPI উইথড্র বন্ধ আছে",
    "Wallet withdrawal is disabled": "ওয়ালেট উইথড্র বন্ধ আছে",
    "Please save your withdraw details in Profile first": "আগে প্রোফাইলে আপনার উইথড্র তথ্য সেভ করুন",
    "Insufficient balance": "ব্যালেন্স যথেষ্ট নয়",
    "Amount is too small after fees": "ফি কাটার পর পরিমাণ খুব কম",
    "Enter a valid amount": "সঠিক পরিমাণ লিখুন",
    "Payment not found": "পেমেন্ট পাওয়া যায়নি",
    "Request not found": "অনুরোধ পাওয়া যায়নি",
    "This request can no longer be cancelled": "এই অনুরোধ আর বাতিল করা যাবে না",
  };

  const SERVER_PATTERNS = [
    [/^Deposit must be between ₹([\d.]+) and ₹([\d.]+)$/, (a, b) => `ডিপোজিট ₹${a} থেকে ₹${b} এর মধ্যে হতে হবে`],
    [/^Withdraw must be between ₹([\d.]+) and ₹([\d.]+)$/, (a, b) => `উইথড্র ₹${a} থেকে ₹${b} এর মধ্যে হতে হবে`],
    [/^Daily withdraw limit is ₹([\d.]+)\. Remaining today: ₹([\d.]+)$/, (a, b) => `দৈনিক উইথড্র সীমা ₹${a}। আজ বাকি: ₹${b}`],
    [/^Your monthly limit is ₹([\d.]+)\. Remaining this month: ₹([\d.]+)$/, (a, b) => `আপনার মাসিক সীমা ₹${a}। এই মাসে বাকি: ₹${b}`],
    [/^Image is too large \(max ([\d.]+) MB\)$/, (n) => `ছবিটি অনেক বড় (সর্বোচ্চ ${n} MB)`],
  ];

  function serverMessage(msg) {
    msg = String(msg || "");
    if (lang !== "bn" || !msg) return msg;
    if (SERVER_EXACT[msg]) return SERVER_EXACT[msg];
    for (const [rx, fn] of SERVER_PATTERNS) {
      const m = msg.match(rx);
      if (m) return fn(...m.slice(1));
    }
    return msg;
  }

  /* ---------- Common strings ---------- */

  const EN = {
    "splash.tagline": "Complete tasks. Earn money.",

    "common.ok": "OK",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.save": "Save",
    "common.saved": "Saved",
    "common.close": "Close",
    "common.back": "Back",
    "common.next": "Next",
    "common.done": "Done",
    "common.retry": "Try again",
    "common.loading": "Loading...",
    "common.loadMore": "Load more",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.share": "Share",
    "common.search": "Search",
    "common.all": "All",
    "common.yes": "Yes",
    "common.no": "No",
    "common.on": "On",
    "common.off": "Off",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.add": "Add",
    "common.remove": "Remove",
    "common.create": "Create",
    "common.update": "Update",
    "common.view": "View",
    "common.open": "Open",
    "common.submit": "Submit",
    "common.optional": "Optional",
    "common.required": "Required",
    "common.noData": "Nothing here yet",
    "common.today": "Today",
    "common.yesterday": "Yesterday",
    "common.amount": "Amount",
    "common.status": "Status",
    "common.date": "Date",
    "common.reason": "Reason",
    "common.hidden": "Hidden user",
    "common.unknown": "Unknown",

    "time.now": "just now",
    "time.m": "{n}m ago",
    "time.h": "{n}h ago",
    "time.d": "{n}d ago",
    "time.expired": "Expired",
    "time.left.d": "{d}d {h}h left",
    "time.left.h": "{h}h {m}m left",
    "time.left.m": "{m}m left",

    "err.network": "Network problem. Check your connection and try again.",
    "err.generic": "Something went wrong. Please try again.",
    "err.copyFail": "Could not copy",
    "err.imageType": "Please choose a JPG or PNG image",

    "fatal.unauthorized.title": "Open inside Telegram",
    "fatal.unauthorized.text": "This app works only inside Telegram. Open it from the bot and try again.",
    "fatal.banned.title": "Account restricted",
    "fatal.banned.text": "Your account has been restricted. Contact support if you think this is a mistake.",
    "fatal.maintenance.title": "Under maintenance",
    "fatal.maintenance.text": "We are upgrading. Please try again soon.",
    "fatal.network.title": "No connection",
    "fatal.network.text": "Network problem. Check your connection and try again.",

    "nav.home": "Home",
    "nav.club": "Club",
    "nav.task": "Task",
    "nav.referral": "Referral",
    "nav.profile": "Profile",

    "status.pending": "Pending",
    "status.approved": "Approved",
    "status.rejected": "Rejected",
    "status.success": "Success",
    "status.failed": "Failed",
    "status.processing": "Processing",
    "status.awaiting_approval": "Awaiting approval",
    "status.cancelled": "Cancelled",
    "status.created": "Created",

    "tx.task": "Task reward",
    "tx.deposit": "Deposit",
    "tx.withdraw": "Withdraw",
    "tx.withdraw_refund": "Withdraw refund",
    "tx.referral_l1": "Referral (Level 1)",
    "tx.referral_l2": "Referral (Level 2)",
    "tx.checkin": "Daily check-in",
    "tx.bonus": "Bonus",
    "tx.admin_adjust": "Balance adjustment",

    "method.upi": "UPI",
    "method.finzo_wallet": "FINZO Wallet",

    "lang.en": "English",
    "lang.bn": "বাংলা",
  };

  const BN = {
    "splash.tagline": "টাস্ক করুন। টাকা আয় করুন।",

    "common.ok": "ঠিক আছে",
    "common.cancel": "বাতিল",
    "common.confirm": "নিশ্চিত করুন",
    "common.save": "সেভ করুন",
    "common.saved": "সেভ হয়েছে",
    "common.close": "বন্ধ করুন",
    "common.back": "পেছনে",
    "common.next": "পরবর্তী",
    "common.done": "সম্পন্ন",
    "common.retry": "আবার চেষ্টা করুন",
    "common.loading": "লোড হচ্ছে...",
    "common.loadMore": "আরও দেখুন",
    "common.copy": "কপি",
    "common.copied": "কপি হয়েছে",
    "common.share": "শেয়ার",
    "common.search": "খুঁজুন",
    "common.all": "সব",
    "common.yes": "হ্যাঁ",
    "common.no": "না",
    "common.on": "চালু",
    "common.off": "বন্ধ",
    "common.edit": "এডিট",
    "common.delete": "মুছুন",
    "common.add": "যোগ করুন",
    "common.remove": "সরান",
    "common.create": "তৈরি করুন",
    "common.update": "আপডেট",
    "common.view": "দেখুন",
    "common.open": "খুলুন",
    "common.submit": "জমা দিন",
    "common.optional": "ঐচ্ছিক",
    "common.required": "আবশ্যক",
    "common.noData": "এখনো কিছু নেই",
    "common.today": "আজ",
    "common.yesterday": "গতকাল",
    "common.amount": "পরিমাণ",
    "common.status": "অবস্থা",
    "common.date": "তারিখ",
    "common.reason": "কারণ",
    "common.hidden": "গোপন ইউজার",
    "common.unknown": "অজানা",

    "time.now": "এইমাত্র",
    "time.m": "{n} মিনিট আগে",
    "time.h": "{n} ঘণ্টা আগে",
    "time.d": "{n} দিন আগে",
    "time.expired": "মেয়াদ শেষ",
    "time.left.d": "{d} দিন {h} ঘণ্টা বাকি",
    "time.left.h": "{h} ঘণ্টা {m} মিনিট বাকি",
    "time.left.m": "{m} মিনিট বাকি",

    "err.network": "নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।",
    "err.generic": "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।",
    "err.copyFail": "কপি করা যায়নি",
    "err.imageType": "অনুগ্রহ করে JPG বা PNG ছবি বেছে নিন",

    "fatal.unauthorized.title": "টেলিগ্রামের ভেতর থেকে খুলুন",
    "fatal.unauthorized.text": "এই অ্যাপ শুধু টেলিগ্রামের ভেতরে কাজ করে। বট থেকে খুলে আবার চেষ্টা করুন।",
    "fatal.banned.title": "অ্যাকাউন্ট সীমিত",
    "fatal.banned.text": "আপনার অ্যাকাউন্ট সীমিত করা হয়েছে। ভুল মনে হলে সাপোর্টে যোগাযোগ করুন।",
    "fatal.maintenance.title": "রক্ষণাবেক্ষণ চলছে",
    "fatal.maintenance.text": "আমরা আপগ্রেড করছি। একটু পরে আবার চেষ্টা করুন।",
    "fatal.network.title": "সংযোগ নেই",
    "fatal.network.text": "নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।",

    "nav.home": "হোম",
    "nav.club": "ক্লাব",
    "nav.task": "টাস্ক",
    "nav.referral": "রেফারেল",
    "nav.profile": "প্রোফাইল",

    "status.pending": "অপেক্ষমাণ",
    "status.approved": "অনুমোদিত",
    "status.rejected": "বাতিল",
    "status.success": "সফল",
    "status.failed": "ব্যর্থ",
    "status.processing": "প্রক্রিয়াধীন",
    "status.awaiting_approval": "অনুমোদনের অপেক্ষায়",
    "status.cancelled": "বাতিল",
    "status.created": "তৈরি হয়েছে",

    "tx.task": "টাস্ক পুরস্কার",
    "tx.deposit": "ডিপোজিট",
    "tx.withdraw": "উইথড্র",
    "tx.withdraw_refund": "উইথড্র ফেরত",
    "tx.referral_l1": "রেফারেল (লেভেল ১)",
    "tx.referral_l2": "রেফারেল (লেভেল ২)",
    "tx.checkin": "দৈনিক চেক-ইন",
    "tx.bonus": "বোনাস",
    "tx.admin_adjust": "ব্যালেন্স সমন্বয়",

    "method.upi": "UPI",
    "method.finzo_wallet": "FINZO ওয়ালেট",

    "lang.en": "English",
    "lang.bn": "বাংলা",
  };

  extend(EN, BN);

  window.I18n = { extend, t, pick, loc, levelName, apply, setLang, lang: () => lang, serverMessage };
  window.t = t;
})();

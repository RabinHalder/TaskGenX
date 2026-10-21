(function () {
  var DICT = {
    en: {
      'qa.invite': 'Invite',
      'home.live': 'Live activity',
      'home.levelProgress': 'Level progress',
      'home.hideBalance': 'Hide balance',
      'home.showBalance': 'Show balance',
      'club.live': 'Live',
      'task.available': '{n} tasks available',
      'ref.how.title': 'How referrals work',
      'ref.step1': 'Share your link with friends',
      'ref.step2': 'They join and complete tasks',
      'ref.step3': 'You earn commission automatically',
      'es.tasks': 'No tasks available',
      'es.history': 'Nothing here yet',
      'es.club': 'No activity yet',
      'es.tx': 'No transactions yet',
      'es.ref': 'No referrals yet',
      'prof.account': 'Account overview',
      'prof.preferences': 'Preferences'
    },
    bn: {
      'qa.invite': 'আমন্ত্রণ',
      'home.live': 'লাইভ অ্যাক্টিভিটি',
      'home.levelProgress': 'লেভেলের অগ্রগতি',
      'home.hideBalance': 'ব্যালেন্স লুকান',
      'home.showBalance': 'ব্যালেন্স দেখান',
      'club.live': 'লাইভ',
      'task.available': '{n}টি টাস্ক পাওয়া যাচ্ছে',
      'ref.how.title': 'রেফারেল কীভাবে কাজ করে',
      'ref.step1': 'বন্ধুদের সাথে আপনার লিংক শেয়ার করুন',
      'ref.step2': 'তারা যোগ দিয়ে টাস্ক সম্পন্ন করবে',
      'ref.step3': 'আপনি স্বয়ংক্রিয়ভাবে কমিশন পাবেন',
      'es.tasks': 'কোনো টাস্ক নেই',
      'es.history': 'এখানে এখনো কিছু নেই',
      'es.club': 'এখনো কোনো অ্যাক্টিভিটি নেই',
      'es.tx': 'এখনো কোনো লেনদেন নেই',
      'es.ref': 'এখনো কোনো রেফারেল নেই',
      'prof.account': 'অ্যাকাউন্টের সারসংক্ষেপ',
      'prof.preferences': 'পছন্দসমূহ'
    }
  };

  window.t2 = function (key, vars) {
    var d = DICT[window.I18N ? I18N.lang : 'en'] || DICT.en;
    var s = d[key] || DICT.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(vars[k]);
      });
    }
    return s;
  };
})();

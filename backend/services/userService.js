const User = require('../models/User');
const { checkLevelUp } = require('./levelService');
const { creditUser } = require('./wallet');
const { notifyUser } = require('./telegram');

async function getOrCreateUser(tgUser, startParam, settings) {
  const telegramId = Number(tgUser.id);
  const firstName = tgUser.first_name || '';
  const lastName = tgUser.last_name || '';
  const username = tgUser.username || '';
  const photoUrl = tgUser.photo_url || '';

  const existing = await User.findOne({ telegramId: telegramId });

  if (existing) {
    const patch = {};
    if (existing.firstName !== firstName) patch.firstName = firstName;
    if (existing.lastName !== lastName) patch.lastName = lastName;
    if (existing.username !== username) patch.username = username;
    if (photoUrl && existing.photoUrl !== photoUrl) patch.photoUrl = photoUrl;

    const lastActive = existing.lastActiveAt ? existing.lastActiveAt.getTime() : 0;
    if (Date.now() - lastActive > 5 * 60 * 1000) patch.lastActiveAt = new Date();

    if (Object.keys(patch).length === 0) return existing;
    return User.findOneAndUpdate({ telegramId: telegramId }, { $set: patch }, { new: true });
  }

  // New user: check the referral code (referral code = referrer's Telegram ID)
  let referrer = null;
  const refId = Number(String(startParam || '').replace(/^ref_?/, ''));
  if (refId > 0 && refId !== telegramId) {
    referrer = await User.findOne({ telegramId: refId });
  }

  let user;
  try {
    user = await User.create({
      telegramId: telegramId,
      firstName: firstName,
      lastName: lastName,
      username: username,
      photoUrl: photoUrl,
      referredBy: referrer ? referrer.telegramId : null,
      referredByLevel2: referrer && referrer.referredBy ? referrer.referredBy : null
    });
  } catch (err) {
    if (err.code === 11000) {
      return User.findOne({ telegramId: telegramId });
    }
    throw err;
  }

  if (referrer) {
    await User.updateOne({ telegramId: referrer.telegramId }, { $inc: { referralsCount: 1 } });
    await checkLevelUp(referrer.telegramId);
    notifyUser(referrer.telegramId, '🎉 A new user joined with your referral link: ' + user.fullName);
  }

  const bonus = Number(settings && settings.bonus ? settings.bonus.signup : 0) || 0;
  if (bonus > 0) {
    const updated = await creditUser(telegramId, bonus, 'signup_bonus', 'Signup bonus');
    if (updated) {
      await User.updateOne({ telegramId: telegramId }, { $set: { signupBonusGiven: true } });
      return User.findOne({ telegramId: telegramId });
    }
  }

  return user;
}

module.exports = { getOrCreateUser };

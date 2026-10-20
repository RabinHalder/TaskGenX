const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { round2 } = require('../utils/money');

async function creditUser(userId, amount, type, note, extra) {
  const value = round2(amount);
  if (!(value > 0)) return null;

  const user = await User.findOneAndUpdate(
    { telegramId: userId },
    { $inc: { balance: value } },
    { new: true }
  );
  if (!user) return null;

  await Transaction.create(
    Object.assign(
      {
        userId: userId,
        type: type,
        direction: 'credit',
        status: 'success',
        amount: value,
        netAmount: value,
        note: note || '',
        completedAt: new Date()
      },
      extra || {}
    )
  );

  return user;
}

// Returns the updated user, or null if the balance is not enough.
async function debitUser(userId, amount) {
  const value = round2(amount);
  if (!(value > 0)) return null;

  return User.findOneAndUpdate(
    { telegramId: userId, balance: { $gte: value } },
    { $inc: { balance: -value } },
    { new: true }
  );
}

module.exports = { creditUser, debitUser };

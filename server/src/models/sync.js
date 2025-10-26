const User = require('./users.model');

const product = require('./product.model');
const historyBook = require('./historyBook.model');

// User.hasOne(apikey, { foreignKey: 'userId', as: 'apiKey', onDelete: 'CASCADE' });
// apikey.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const sync = async () => {
    await User.sync();
    // await apikey.sync({ alter: true });
    await product.sync();
    await historyBook.sync();
    // await otp.sync();
};

module.exports = sync;
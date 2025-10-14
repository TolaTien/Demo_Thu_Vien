require('dotenv').config();
const { Sequelize } = require('sequelize');

const connect = new Sequelize(
    process.env.DB_NAME,       // lấy tên DB từ .env
    process.env.DB_USER,       // lấy user từ .env
    process.env.DB_PASSWORD,   // lấy password từ .env
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        port: process.env.MYSQL_PORT,
    }
);

const connectDB = async () => {
    try {
        await connect.authenticate();
        console.log('✅ Connect Database Success!');
    } catch (error) {
        console.error('❌ Error connect database:', error);
    }
};

module.exports = { connectDB, connect };

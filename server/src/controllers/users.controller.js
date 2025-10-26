const modelUser = require('../models/users.model');
const User = require('../models/users.model');
const Product = require('../models/product.model');
const HistoryBook = require('../models/historyBook.model');
const { Op } = require('sequelize');
const { createRefreshToken, createToken, verifyToken } = require('../services/tokenServices');

const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class ControllerUser {
    // Đăng ký
    async registerUser(req, res) {
        try {
            const { fullName, phone, address, email, password } = req.body;
            if (!fullName || !email || !password) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
            }

            const existingUser = await modelUser.findOne({ where: { email } });
            if (existingUser) return res.status(400).json({ message: 'Email đã tồn tại' });

            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(password, salt);

            const newUser = await modelUser.create({
                fullName,
                phone,
                address,
                email,
                password: passwordHash,
                typeLogin: 'email',
            });

            const token = await createToken({ id: newUser.id });
            const refreshToken = await createRefreshToken({ id: newUser.id });

            // Lưu cookie
            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 15 * 60 * 1000 });
            res.cookie('logged', 1, { httpOnly: false, secure: true, sameSite: 'Strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

            return res.status(201).json({
                status: 'success',
                message: 'Đăng ký thành công',
                data: { token, refreshToken },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Đăng nhập
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });

            // Admin
            if (email === 'admin@gmail.com' && password === '123456') {
                const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
                const refreshToken = jwt.sign({ email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

                res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
                res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
                res.cookie('logged', 1, { httpOnly: false, secure: true, sameSite: 'Strict' });

                return res.status(200).json({
                    status: 'success',
                    message: 'Đăng nhập thành công (admin)',
                    data: { token, refreshToken, redirectTo: '/admin' },
                });
            }

            const findUser = await modelUser.findOne({ where: { email } });
            if (!findUser) return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });

            const isValid = bcrypt.compareSync(password, findUser.password);
            if (!isValid) return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });

            const token = await createToken({ id: findUser.id });
            const refreshToken = await createRefreshToken({ id: findUser.id });

            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
            res.cookie('logged', 1, { httpOnly: false, secure: true, sameSite: 'Strict' });

            return res.status(200).json({
                status: 'success',
                message: 'Đăng nhập thành công',
                data: { token, refreshToken, redirectTo: '/' },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Xác thực người dùng
    async authUser(req, res) {
        try {
            const { id } = req.user;
            const findUser = await modelUser.findOne({ where: { id } });
            if (!findUser) return res.status(401).json({ message: 'Tài khoản không tồn tại' });

            const encryptedUser = CryptoJS.AES.encrypt(JSON.stringify(findUser), process.env.SECRET_CRYPTO).toString();
            return res.status(200).json({ status: 'success', message: 'success', data: encryptedUser });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Làm mới token
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) return res.status(401).json({ message: 'Không tìm thấy refresh token' });

            const decoded = await verifyToken(refreshToken);
            const user = await modelUser.findOne({ where: { id: decoded.id } });
            const token = await createToken({ id: user.id });

            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
            return res.status(200).json({ status: 'success', message: 'Làm mới token thành công', data: { token } });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async logout(req, res) {
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        res.clearCookie('logged');
        return res.status(200).json({ status: 'success', message: 'Đăng xuất thành công' });
    }

    
    async updateInfoUser(req, res) {
        try {
            const { id } = req.user;
            const { fullName, address, phone, sex } = req.body;
            const user = await modelUser.findOne({ where: { id } });
            if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

            await user.update({ fullName, address, phone, sex });

            return res.status(200).json({ status: 'success', message: 'Cập nhật thông tin thành công' });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async getUsers(req, res) {
        const users = await modelUser.findAll();
        return res.status(200).json({ status: 'success', message: 'Lấy danh sách người dùng thành công', data: users });
    }

    async updateUser(req, res) {
        const { userId, fullName, phone, email, role, address } = req.body;
        const user = await modelUser.findOne({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        Object.assign(user, { fullName, phone, email, role, address });
        await user.save();

        return res.status(200).json({ status: 'success', message: 'Cập nhật người dùng thành công' });
    }

    async deleteUser(req, res) {
        const { userId } = req.body;
        const user = await modelUser.findOne({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        await user.destroy();
        return res.status(200).json({ status: 'success', message: 'Xóa người dùng thành công' });
    }

    // async updatePassword(req, res) {
    //     const { userId, password } = req.body;
    //     const user = await modelUser.findOne({ where: { id: userId } });
    //     if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    //     const passwordHash = bcrypt.hashSync(password, 10);
    //     user.password = passwordHash;
    //     await user.save();

    //     return res.status(200).json({ status: 'success', message: 'Cập nhật mật khẩu thành công' });
    // }

    async requestIdStudent(req, res) {
        const { id } = req.user;
        const user = await modelUser.findOne({ where: { id } });
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        if (user.idStudent !== null && user.idStudent === '0') {
            return res.status(400).json({ message: 'Vui lòng chờ xác nhận ID sinh viên' });
        }

        user.idStudent = '0';
        await user.save();

        return res.status(200).json({ status: 'success', message: 'Yêu cầu thành công' });
    }

    async confirmIdStudent(req, res) {
        const { idStudent, userId } = req.body;
        if (!idStudent || !userId) return res.status(400).json({ message: 'Vui lòng nhập ID sinh viên' });

        const user = await modelUser.findOne({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        user.idStudent = idStudent;
        await user.save();

        return res.status(200).json({ status: 'success', message: 'Xác nhận thành công' });
    }

    async getStatistics(req, res) {
        try {
            const totalUsers = await User.count();
            const totalBooks = await Product.count();
            const pendingRequests = await HistoryBook.count({ where: { status: 'pending' } });

            const booksInStock = await Product.count({ where: { stock: { [Op.gt]: 0 } } });
            const booksOutOfStock = totalBooks - booksInStock;

            const bookStatusData = [
                { type: 'Còn sách', value: booksInStock },
                { type: 'Hết sách', value: booksOutOfStock },
            ];

            const approvedLoans = await HistoryBook.count({ where: { status: 'success' } });
            const rejectedLoans = await HistoryBook.count({ where: { status: 'cancel' } });
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const overdueLoans = await HistoryBook.count({
                where: { status: 'success', returnDate: null, borrowDate: { [Op.lt]: fourteenDaysAgo } },
            });

            const loanStatusData = [
                { status: 'Đã duyệt', count: approvedLoans },
                { status: 'Chờ duyệt', count: pendingRequests },
                { status: 'Từ chối', count: rejectedLoans },
                { status: 'Quá hạn', count: overdueLoans },
            ];

            return res.status(200).json({
                status: 'success',
                message: 'Lấy thống kê thành công',
                data: { totalUsers, totalBooks, pendingRequests, bookStatusData, loanStatusData },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async getRequestLoan(req, res) {
        try {
            const requestList = await modelUser.findAll({
                where: { idStudent: '0' },
                attributes: ['id', 'fullName', 'email', 'phone', 'idStudent', 'createdAt'],
                order: [['createdAt', 'DESC']],
            });

            return res.status(200).json({
                status: 'success',
                message: 'Lấy danh sách yêu cầu cấp thẻ sinh viên thành công',
                data: requestList,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerUser();

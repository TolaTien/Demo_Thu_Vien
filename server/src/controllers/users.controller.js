const modelUser = require('../models/users.model');
const modelOtp = require('../models/otp.model');
const { AuthFailureError, BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');
const User = require('../models/users.model');
const Product = require('../models/product.model');
const HistoryBook = require('../models/historyBook.model');
const { Op } = require('sequelize');
const { createRefreshToken, createToken, verifyToken } = require('../services/tokenServices');

const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class ControllerUser {
    // Đăng ký
    async registerUser(req, res) {
        const { fullName, phone, address, email, password } = req.body;
        if (!fullName || !phone || !email || !password) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        const existingUser = await modelUser.findOne({ where: { email } });
        if (existingUser) throw new BadRequestError('Email đã tồn tại');

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
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('logged', 1, {
            httpOnly: false,
            secure: true,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        new OK({ message: 'Đăng ký thành công', metadata: { token, refreshToken } }).send(res);
    }

    // Đăng nhập
    async loginUser(req, res) {
        const { email, password } = req.body;
        if (!email || !password) throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');

        // ✅ Nếu là admin thì cho qua luôn, không cần kiểm tra DB
        if (email === 'admin@gmail.com' && password === '123456') {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
            const refreshToken = jwt.sign({ email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
            res.cookie('logged', 1, { httpOnly: false, secure: true, sameSite: 'Strict' });

            return new OK({
                message: 'Đăng nhập thành công (admin)',
                metadata: { token, refreshToken, redirectTo: '/admin' },
            }).send(res);
        }

        // ✅ Người dùng bình thường
        const findUser = await modelUser.findOne({ where: { email } });
        if (!findUser) throw new AuthFailureError('Tài khoản hoặc mật khẩu không chính xác');

        const isValid = bcrypt.compareSync(password, findUser.password);
        if (!isValid) throw new AuthFailureError('Tài khoản hoặc mật khẩu không chính xác');

        const token = await createToken({ id: findUser.id });
        const refreshToken = await createRefreshToken({ id: findUser.id });

        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.cookie('logged', 1, { httpOnly: false, secure: true, sameSite: 'Strict' });

        new OK({
            message: 'Đăng nhập thành công',
            metadata: { token, refreshToken, redirectTo: '/' },
        }).send(res);
    }

    // Xác thực người dùng
    async authUser(req, res) {
        const { id } = req.user;
        const findUser = await modelUser.findOne({ where: { id } });
        if (!findUser) throw new AuthFailureError('Tài khoản không tồn tại');

        const encryptedUser = CryptoJS.AES.encrypt(
            JSON.stringify(findUser),
            process.env.SECRET_CRYPTO
        ).toString();

        new OK({ message: 'success', metadata: encryptedUser }).send(res);
    }

    // Làm mới token
    async refreshToken(req, res) {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) throw new AuthFailureError('Không tìm thấy refresh token');

        const decoded = await verifyToken(refreshToken);
        const user = await modelUser.findOne({ where: { id: decoded.id } });
        const token = await createToken({ id: user.id });

        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
        new OK({ message: 'Làm mới token thành công', metadata: { token } }).send(res);
    }

    // Đăng xuất
    async logout(req, res) {
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        res.clearCookie('logged');
        new OK({ message: 'Đăng xuất thành công' }).send(res);
    }

    // Cập nhật thông tin người dùng
    async updateInfoUser(req, res) {
        const { id } = req.user;
        const { fullName, address, phone, sex } = req.body;
        const user = await modelUser.findOne({ where: { id } });
        if (!user) throw new BadRequestError('Không tìm thấy tài khoản');

        const image = req.file ? user.avatar : user.avatar;
        await user.update({ fullName, address, phone, sex, avatar: image });

        new OK({ message: 'Cập nhật thông tin thành công' }).send(res);
    }

    // Đăng nhập Google
    async loginGoogle(req, res) {
        const { credential } = req.body;
        const dataToken = jwtDecode(credential);
        let user = await modelUser.findOne({ where: { email: dataToken.email } });

        if (!user) {
            user = await modelUser.create({
                fullName: dataToken.name,
                email: dataToken.email,
                typeLogin: 'google',
            });
        }

        const token = await createToken({ id: user.id });
        const refreshToken = await createRefreshToken({ id: user.id });

        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.cookie('logged', 1, { httpOnly: false, secure: true, sameSite: 'Strict' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });

        new OK({ message: 'Đăng nhập thành công', metadata: { token, refreshToken } }).send(res);
    }

    // Quên mật khẩu / đặt lại (demo)
    async forgotPassword(req, res) {
        return res.status(200).json({ message: 'Gửi thành công (đã bỏ phần OTP)' });
    }

    async resetPassword(req, res) {
        return res.status(200).json({ message: 'Đặt lại mật khẩu thành công (demo)' });
    }

    // Danh sách & quản lý người dùng
    async getUsers(req, res) {
        const users = await modelUser.findAll();
        new OK({ message: 'Lấy danh sách người dùng thành công', metadata: users }).send(res);
    }

    async updateUser(req, res) {
        const { userId, fullName, phone, email, role, address } = req.body;
        const user = await modelUser.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        Object.assign(user, { fullName, phone, email, role, address });
        await user.save();

        new OK({ message: 'Cập nhật người dùng thành công' }).send(res);
    }

    async changeAvatar(req, res) {
        const { file } = req;
        const { id } = req.user;
        if (!file) throw new BadRequestError('Vui lòng chọn file');

        const user = await modelUser.findOne({ where: { id } });
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        user.avatar = `uploads/avatars/${file.filename}`;
        await user.save();

        new OK({
            message: 'Upload thành công',
            metadata: `uploads/avatars/${file.filename}`,
        }).send(res);
    }

    async deleteUser(req, res) {
        const { userId } = req.body;
        const user = await modelUser.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        await user.destroy();
        new OK({ message: 'Xóa người dùng thành công' }).send(res);
    }

    async updatePassword(req, res) {
        const { userId, password } = req.body;
        const user = await modelUser.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        const passwordHash = bcrypt.hashSync(password, 10);
        user.password = passwordHash;
        await user.save();

        new OK({ message: 'Cập nhật mật khẩu thành công' }).send(res);
    }

    // Xử lý ID sinh viên
    async requestIdStudent(req, res) {
        const { id } = req.user;
        const user = await modelUser.findOne({ where: { id } });
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        if (user.idStudent !== null && user.idStudent === '0') {
            throw new BadRequestError('Vui lòng chờ xác nhận ID sinh viên');
        }

        user.idStudent = '0';
        await user.save();

        new OK({ message: 'Yêu cầu thành công' }).send(res);
    }

    async confirmIdStudent(req, res) {
        const { idStudent, userId } = req.body;
        if (!idStudent || !userId) throw new BadRequestError('Vui lòng nhập ID sinh viên');

        const user = await modelUser.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        user.idStudent = idStudent;
        await user.save();

        new OK({ message: 'Xác nhận thành công' }).send(res);
    }

    // Thống kê
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

            res.status(200).json({
                totalUsers,
                totalBooks,
                pendingRequests,
                bookStatusData,
                loanStatusData,
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server: ' + error.message });
        }
    }
    // Thêm vào cuối class ControllerUser (ngay trên module.exports)
async getRequestLoan(req, res) {
    try {
        // Lấy danh sách người dùng đang chờ cấp ID sinh viên
        const requestList = await modelUser.findAll({
            where: { idStudent: '0' },
            attributes: ['id', 'fullName', 'email', 'phone', 'avatar', 'idStudent', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });

        new OK({
            message: 'Lấy danh sách yêu cầu cấp thẻ sinh viên thành công',
            metadata: requestList,
        }).send(res);
    } catch (error) {
        console.error('getRequestLoan error:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
}

    
}

module.exports = new ControllerUser();

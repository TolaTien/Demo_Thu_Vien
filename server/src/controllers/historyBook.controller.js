const modelHistoryBook = require('../models/historyBook.model');
const modelUser = require('../models/users.model');
const modelProduct = require('../models/product.model');

class historyBookController {
    // [POST] /api/history-book/create
    async createHistoryBook(req, res) {
        try {
            const { id } = req.user;
            const findUser = await modelUser.findOne({ where: { id } });
            if (!findUser) {
                return res.status(400).json({ success: false, message: 'Người dùng không tồn tại' });
            }
            if (!findUser.idStudent || findUser.idStudent === '0' || findUser.idStudent.trim() === '') {
                return res.status(400).json({ success: false, message: 'Bạn chưa có ID sinh viên !!!' });
            }

            const { fullName, phoneNumber, address, bookId, borrowDate, returnDate, quantity } = req.body;
            if (!fullName || !phoneNumber || !address || !bookId || !borrowDate || !returnDate || !quantity) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
            }

            const findProduct = await modelProduct.findOne({ where: { id: bookId } });
            if (!findProduct) {
                return res.status(400).json({ success: false, message: 'Sách không tồn tại' });
            }

            // Giảm số lượng tồn kho
            if (findProduct.stock < quantity) {
                return res.status(400).json({ success: false, message: 'Số lượng sách không đủ' });
            }

            await modelProduct.update({ stock: findProduct.stock - quantity }, { where: { id: bookId } });

            const historyBook = await modelHistoryBook.create({
                fullName,
                phone: phoneNumber,
                address,
                bookId,
                borrowDate,
                returnDate,
                quantity,
                userId: id,
            });

            return res.status(201).json({
                success: true,
                message: 'Tạo lịch sử mượn sách thành công',
                data: historyBook,
            });
        } catch (error) {
            console.error('❌ Lỗi tại createHistoryBook:', error);
            res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
        }
    }

    // [GET] /api/history-book/user
    async getHistoryUser(req, res) {
        try {
            const { id } = req.user;
            const historyBook = await modelHistoryBook.findAll({ where: { userId: id } });

            const data = await Promise.all(
                historyBook.map(async (item) => {
                    const product = await modelProduct.findOne({ where: { id: item.bookId } });
                    return { ...item.dataValues, product };
                }),
            );

            res.status(200).json({
                success: true,
                message: 'Lấy lịch sử mượn thành công',
                data,
            });
        } catch (error) {
            console.error('❌ Lỗi tại getHistoryUser:', error);
            res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
        }
    }

    // [POST] /api/history-book/cancel
    async cancelBook(req, res) {
        try {
            const { id } = req.user;
            const { idHistory } = req.body;

            const findHistory = await modelHistoryBook.findOne({ where: { id: idHistory, userId: id } });
            if (!findHistory) {
                return res.status(400).json({ success: false, message: 'Lịch sử mượn không tồn tại' });
            }

            const findProduct = await modelProduct.findOne({ where: { id: findHistory.bookId } });
            if (!findProduct) {
                return res.status(400).json({ success: false, message: 'Sách không tồn tại' });
            }

            await modelHistoryBook.update({ status: 'cancel' }, { where: { id: idHistory } });
            await modelProduct.update(
                { stock: findProduct.stock + findHistory.quantity },
                { where: { id: findHistory.bookId } },
            );

            res.status(200).json({ success: true, message: 'Hủy mượn sách thành công' });
        } catch (error) {
            console.error('❌ Lỗi tại cancelBook:', error);
            res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
        }
    }

    // [GET] /api/history-book/all
    async getAllHistoryBook(req, res) {
        try {
            const historyBook = await modelHistoryBook.findAll({
                order: [['createdAt', 'DESC']],
            });

            const data = await Promise.all(
                historyBook.map(async (item) => {
                    const product = await modelProduct.findOne({ where: { id: item.bookId } });
                    return { ...item.dataValues, product };
                }),
            );

            res.status(200).json({
                success: true,
                message: 'Lấy toàn bộ lịch sử mượn thành công',
                data,
            });
        } catch (error) {
            console.error('❌ Lỗi tại getAllHistoryBook:', error);
            res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
        }
    }

    // [PUT] /api/history-book/update
    async updateStatusBook(req, res) {
        try {
            const { idHistory, status } = req.body;

            const findHistory = await modelHistoryBook.findOne({ where: { id: idHistory } });
            if (!findHistory) {
                return res.status(400).json({ success: false, message: 'Lịch sử mượn không tồn tại' });
            }

            await modelHistoryBook.update({ status }, { where: { id: idHistory } });

            res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái mượn thành công',
            });
        } catch (error) {
            console.error('❌ Lỗi tại updateStatusBook:', error);
            res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
        }
    }
}

module.exports = new historyBookController();

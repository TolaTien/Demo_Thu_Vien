const express = require('express');
const app = express();
const port = 4000;

const { connectDB } = require('./config/connectDB');
const sync = require('./models/sync');

const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const route = require('./routes/index.routes');
const path = require('path');

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../src')));

connectDB();

sync();

route(app);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server',
    });
});

app.listen(port,'0.0.0.0', () => {
    console.log(`Example app listening on port ${port}`);
});


// const express = require('express');
// const app = express();
// const port = process.env.PORT || 4000;

// const { connectDB } = require('./config/connectDB');
// const sync = require('./models/sync');

// const cors = require('cors');
// const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
// const route = require('./routes/index.routes');
// const path = require('path');

// // ✅ Cho phép frontend trên máy khác truy cập qua LAN
// app.use(cors({
//     origin: ['http://localhost:5173', 'http://192.168.10.104:5173'],
//     credentials: true
// }));

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, '../src')));

// connectDB();
// sync();
// route(app);

// app.use((err, req, res, next) => {
//     const statusCode = err.statusCode || 500;
//     res.status(statusCode).json({
//         success: false,
//         message: err.message || 'Lỗi server',
//     });
// });

// // ✅ Lắng nghe trên tất cả địa chỉ mạng (LAN)
// app.listen(port, '0.0.0.0', () => {
//     console.log(`✅ Server running at:`);
//     console.log(`- Local:   http://localhost:${port}`);
//     console.log(`- Network: http://192.168.10.104:${port}`);
// });

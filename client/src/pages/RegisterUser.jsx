import { useState } from 'react';
import { Button, Form, Input, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { requestRegister } from '../config/request';
import { toast } from 'react-toastify';
import imagesLogin from '../assets/images/login.jpg';

function RegisterUser() {
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);

        // Kiểm tra mật khẩu xác nhận
        if (values.password !== values.confirmPassword) {
            message.error('Mật khẩu xác nhận không khớp!');
            setLoading(false);
            return;
        }

        try {
            await requestRegister(values);
            toast.success('Đăng ký thành công!');
            setLoading(false);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            navigate('/');
        } catch (error) {
            toast.error(error.response.data.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header>
                <Header />
            </header>

            <main className="flex-grow flex items-center justify-center bg-gray-100 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-stretch max-w-6xl mx-auto">
                        {/* Phần hình ảnh */}
                        <div className="hidden lg:flex lg:w-1/2 h-auto">
                            <div className="relative w-full h-full">
                                <img
                                    src={`${import.meta.env.VITE_API_URL_IMAGE}/${imagesLogin}`}
                                    alt="Tour du lịch"
                                    className="rounded-l-xl shadow-lg object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-blue-500 opacity-20 rounded-l-xl"></div>
                            </div>
                        </div>

                        {/* Phần form đăng ký */}
                        <div className="w-full lg:w-1/2 bg-white rounded-r-xl shadow-lg">
                            <div className="p-8">
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold text-gray-800">Đăng ký tài khoản</h1>
                                    <p className="text-gray-600">Tạo tài khoản mới để sử dụng dịch vụ</p>
                                </div>

                                <Form
                                    name="register_form"
                                    className="register-form"
                                    initialValues={{ typeLogin: 'email' }}
                                    onFinish={onFinish}
                                    layout="vertical"
                                    size="large"
                                >
                                    <Form.Item
                                        name="fullName"
                                        rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                                    >
                                        <Input
                                            prefix={<UserOutlined className="text-gray-400" />}
                                            placeholder="Họ và tên"
                                            className="rounded-md"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="email"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập email!' },
                                            { type: 'email', message: 'Email không hợp lệ!' },
                                        ]}
                                    >
                                        <Input
                                            prefix={<MailOutlined className="text-gray-400" />}
                                            placeholder="Email"
                                            className="rounded-md"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined className="text-gray-400" />}
                                            placeholder="Mật khẩu"
                                            className="rounded-md"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="confirmPassword"
                                        rules={[
                                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined className="text-gray-400" />}
                                            placeholder="Xác nhận mật khẩu"
                                            className="rounded-md"
                                        />
                                    </Form.Item>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Form.Item name="phone">
                                            <Input
                                                prefix={<PhoneOutlined className="text-gray-400" />}
                                                placeholder="Số điện thoại (không bắt buộc)"
                                                className="rounded-md"
                                            />
                                        </Form.Item>

                                        <Form.Item name="address">
                                            <Input
                                                prefix={<HomeOutlined className="text-gray-400" />}
                                                placeholder="Địa chỉ (không bắt buộc)"
                                                className="rounded-md"
                                            />
                                        </Form.Item>
                                    </div>

                                    <Form.Item name="typeLogin" hidden>
                                        <Input type="hidden" />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            loading={loading}
                                        >
                                            Đăng ký
                                        </Button>
                                    </Form.Item>

                                    <Divider plain>Hoặc</Divider>

                                    <div className="text-center">
                                        <p className="text-gray-600 mb-4">Đã có tài khoản?</p>
                                        <Link to="/login">
                                            <Button className="w-full">Đăng nhập ngay</Button>
                                        </Link>
                                    </div>
                                </Form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer>
                <Footer />
            </footer>

            {/* Style cho text trên ảnh */}
            <style jsx>{`
                .shadow-text {
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </div>
    );
}

export default RegisterUser;

import { useState } from 'react';
import { Button, Form, Input, message, Card, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import Footer from '../components/Footer';
import Header from '../components/Header';

function ForgotPassword() {
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [loading, setLoading] = useState(false);

    // Bước 1: Gửi email (giả lập)
    const handleEmailSubmit = async (values) => {
        setLoading(true);
        setTimeout(() => {
            message.success(`Link reset mật khẩu đã được gửi tới ${values.email} `);
            setIsEmailSent(true);
            setLoading(false);
        }, 1000);
    };

    // Bước 2: Đặt lại mật khẩu (giả lập)
    const handleResetPassword = async (values) => {
        setLoading(true);
        setTimeout(() => {
            if (values.newPassword !== values.confirmPassword) {
                message.error('Mật khẩu xác nhận không khớp!');
            } else {
                message.success('Đặt lại mật khẩu thành công!');
                window.location.href = '/login';
            }
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header>
                <Header />
            </header>

            <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4">
                <Card className="w-full max-w-md shadow-lg">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Quên mật khẩu</h2>
                        <p className="text-gray-600 mt-2">
                            {!isEmailSent
                                ? 'Nhập email của bạn để nhận link reset mật khẩu'
                                : 'Nhập mật khẩu mới để hoàn tất'}
                        </p>
                    </div>

                    <Divider />

                    {!isEmailSent ? (
                        <Form name="forgot_password" layout="vertical" onFinish={handleEmailSubmit}>
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' },
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="w-full bg-blue-500 hover:bg-blue-600"
                                    size="large"
                                    loading={loading}
                                >
                                    Submit
                                </Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        <Form name="reset_password" layout="vertical" onFinish={handleResetPassword}>
                            <Form.Item
                                name="newPassword"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" size="large" />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu!' }]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" size="large" />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="w-full bg-blue-500 hover:bg-blue-600"
                                    size="large"
                                    loading={loading}
                                >
                                    Đặt lại mật khẩu 
                                </Button>
                            </Form.Item>
                        </Form>
                    )}
                </Card>
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default ForgotPassword;

import React, { useState, useEffect } from 'react';
import { Card, Avatar, Descriptions, Button, Form, Input } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { requestIdStudent, requestUpdateUser } from '../../config/request';
import { toast } from 'react-toastify';
import { useStore } from '../../hooks/useStore';

const PersonalInfo = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();

    const { dataUser } = useStore();

    useEffect(() => {
        if (dataUser) {
            form.setFieldsValue(dataUser);
        }
    }, [dataUser, form]);

    const handleRequestStudentId = async () => {
        try {
            const res = await requestIdStudent();
            toast.success(res.message);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gửi yêu cầu thất bại');
        }
    };

    const handleUpdateProfile = async (values) => {
        try {
            await requestUpdateUser(values);
            toast.success('Cập nhật thông tin thành công');
            setIsEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    const viewItems = [
        { key: '1', label: 'Họ và tên', children: dataUser.fullName },
        { key: '2', label: 'Email', children: dataUser.email },
        { key: '3', label: 'Số điện thoại', children: dataUser.phone || 'Chưa cập nhật' },
        { key: '4', label: 'Địa chỉ', children: dataUser.address || 'Chưa cập nhật' },
        { key: '5', label: 'Mã sinh viên', children: dataUser.idStudent || 'Chưa có' },
    ];

    return (
        <Card
            title="Thông tin cá nhân"
            bordered={false}
            extra={
                !isEditing && (
                    <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                        Chỉnh sửa
                    </Button>
                )
            }
        >
            <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                <div className="flex flex-col items-center gap-2">
                    <Avatar
                        size={100}
                        src={
                            dataUser.avatar
                                ? `${import.meta.env.VITE_API_URL}/${dataUser.avatar}`
                                : null
                        }
                        icon={<UserOutlined />}
                    />
                </div>
                <div className="flex-1 w-full">
                    {isEditing ? (
                        <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
                            <Form.Item
                                name="fullName"
                                label="Họ và tên"
                                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item name="phone" label="Số điện thoại">
                                <Input />
                            </Form.Item>
                            <Form.Item name="address" label="Địa chỉ">
                                <Input />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" className="mr-2">
                                    Lưu thay đổi
                                </Button>
                                <Button onClick={() => setIsEditing(false)}>Hủy</Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        <>
                            <Descriptions bordered layout="vertical" items={viewItems} />
                            {!dataUser.idStudent && (
                                <Button
                                    type="primary"
                                    onClick={handleRequestStudentId}
                                    className="mt-4"
                                >
                                    Gửi yêu cầu cấp mã sinh viên
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default PersonalInfo;

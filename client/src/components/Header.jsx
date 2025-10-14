import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Dropdown, Avatar, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, HistoryOutlined, SendOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import useDebounce from '../hooks/useDebounce';
import { requestLogout, requestSearchProduct } from '../config/request';

function Header() {
    const { dataUser } = useStore();
    const navigate = useNavigate();

    const [valueSearch, setValueSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isResultVisible, setIsResultVisible] = useState(false);

    const debounce = useDebounce(valueSearch, 500);

    const handleLogout = async () => {
        try {
            await requestLogout();
            navigate('/');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!debounce.trim()) {
                setSearchResults([]);
                setIsResultVisible(false);
                return;
            }
            try {
                const res = await requestSearchProduct(debounce);
                setSearchResults(res.metadata);
                setIsResultVisible(res.metadata.length > 0);
            } catch (error) {
                console.error('Failed to search for products:', error);
                setSearchResults([]);
                setIsResultVisible(false);
            }
        };
        fetchData();
    }, [debounce]);

    return (
        <header className="bg-white shadow-md border-b border-gray-200">
            <div className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to={'/'}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <h1 className="text-2xl font-bold text-blue-600">📚 Thư Viện</h1>
                            </div>
                        </div>
                    </Link>
                    {/* Search Bar */}
                    <div className="flex-1 max-w-lg mx-8 relative">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={valueSearch}
                                onChange={(e) => setValueSearch(e.target.value)}
                                onFocus={() => setIsResultVisible(true)}
                                onBlur={() => setTimeout(() => setIsResultVisible(false), 200)} // Delay to allow click on results
                                placeholder="Tìm kiếm sách, tác giả..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {isResultVisible && searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                <ul className="max-h-80 overflow-y-auto">
                                    {searchResults.map((product) => (
                                        <li key={product.id}>
                                            <Link
                                                to={`/product/${product.id}`}
                                                className="flex items-center p-3 hover:bg-gray-100 transition-colors"
                                            >
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL_IMAGE}/${product.image}`}
                                                    alt={product.nameProduct}
                                                    className="w-12 h-16 object-cover rounded-md mr-4"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-800">{product.nameProduct}</p>
                                                    <p className="text-sm text-gray-500">{product.publisher}</p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Auth Buttons / User Info */}
                    <div className="flex items-center space-x-4">
                        {dataUser && dataUser.id ? (
                            // User Info Dropdown
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'profile',
                                            icon: <UserOutlined />,
                                            label: 'Thông tin cá nhân',
                                            onClick: () => navigate('/infoUser'),
                                        },
                                        {
                                            key: 'settings',
                                            icon: <HistoryOutlined />,
                                            label: 'Lịch sử mượn sách',
                                            onClick: () => navigate('/infoUser'),
                                        },
                                        {
                                            key: 'settings2',
                                            icon: <SendOutlined />,
                                            label: 'Gửi yêu cầu cấp mã sinh viên',
                                            onClick: () => navigate('/infoUser'),
                                        },
                                        {
                                            type: 'divider',
                                        },
                                        {
                                            key: 'logout',
                                            icon: <LogoutOutlined />,
                                            label: 'Đăng xuất',
                                            danger: true,
                                            onClick: () => handleLogout(),
                                        },
                                    ],
                                }}
                                placement="bottomRight"
                                arrow
                            >
                                <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                                    <Avatar
                                        size={32}
                                        icon={<UserOutlined />}
                                        src={dataUser.avatar}
                                        className="bg-blue-600"
                                    />
                                    <div className="hidden sm:block">
                                        <p className="text-sm font-medium text-gray-900">
                                            {dataUser.fullName || 'Người dùng'}
                                        </p>
                                        <p className="text-xs text-gray-500">{dataUser.email}</p>
                                    </div>
                                </div>
                            </Dropdown>
                        ) : (
                            // Login/Register Buttons
                            <>
                                <Link to={'/login'}>
                                    <Button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                        Đăng nhập
                                    </Button>
                                </Link>
                                <Link to={'/register'}>
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        Đăng ký
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;

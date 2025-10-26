import { useEffect } from 'react';
import CardBody from './components/Cardbody';
import Footer from './components/Footer';
import Header from './components/Header';
import { requestGetAllProduct } from './config/request';
import { useState } from 'react';

function App() {
    const [dataProduct, setDataProduct] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const res = await requestGetAllProduct();
            setDataProduct(res.data);
        };
        fetchData();
    }, []);

    return (
        <div>
            <header>
                <Header />
            </header>

            <main className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-5 gap-4 w-[90%] mx-auto mt-5">
                {dataProduct.map((item) => (
                    <CardBody key={item.id} data={item} />
                ))}
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default App;

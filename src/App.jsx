import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/ui/Header/Header.jsx';
import Footer from './components/ui/Footer/Footer.jsx';
import Home from './components/sections/Home/Home.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}


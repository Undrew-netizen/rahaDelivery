import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/navBar';
import Footer from './components/Footer';
import Landing from './landing';
import Home from './home';
import Services from './services';
import About from './about';
import Contact from './contact';
import TrackOrder from './trackOrder';
import Admin from './admin';

function App() {
  return (
    <BrowserRouter>
      <div className="App min-h-screen flex flex-col text-slate-900">
        <NavBar />
        <main className="flex-1 pt-28 sm:pt-32">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
export default App;

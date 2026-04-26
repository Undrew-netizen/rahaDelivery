import { Link } from 'react-router-dom';
import { FaEnvelope, FaFacebook, FaInstagram, FaMapMarkerAlt, FaPhone, FaTwitter } from 'react-icons/fa';
import logo from '../assets/logo.png';

function Footer() {
  return (
    <footer className="mt-12 border-t border-emerald-950/10 bg-[#103320] text-white">
      <div className="shell grid gap-10 py-12 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-4">
          <img src={logo} alt="Raha Delivery Logo" className="h-20 w-auto" />
          <p className="max-w-sm text-sm leading-7 text-emerald-50/80">
            Raha helps homes and businesses in Homabay move errands, meals, parcels, and same-day requests with speed and care.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-amber-300">Quick Links</p>
          <div className="flex flex-col gap-3 text-sm text-emerald-50/85">
            <Link to="/" className="hover:text-white">Overview</Link>
            <Link to="/services" className="hover:text-white">Services</Link>
            <Link to="/track-order" className="hover:text-white">Track Delivery</Link>
            <Link to="/about" className="hover:text-white">About</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>

        <div className="space-y-4 text-sm text-emerald-50/85">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-amber-300">Reach Us</p>
          <p className="flex items-center gap-3"><FaMapMarkerAlt className="text-amber-300" /> Homabay Town, Kenya</p>
          <p className="flex items-center gap-3"><FaPhone className="text-amber-300" /> +254 722 826 692</p>
          <p className="flex items-center gap-3"><FaEnvelope className="text-amber-300" /> deliveryraha@gmail.com</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-amber-300">Follow Along</p>
          <div className="flex gap-3 text-xl text-amber-200">
            <span className="rounded-full border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"><FaFacebook /></span>
            <span className="rounded-full border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"><FaTwitter /></span>
            <span className="rounded-full border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"><FaInstagram /></span>
          </div>
          <p className="text-sm leading-7 text-emerald-50/70">
            Delivery updates, rider availability, and service announcements from the Raha team.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell py-5 text-sm text-emerald-50/65">
          &copy; {new Date().getFullYear()} Raha Delivery. Built for everyday life in Homabay.
        </div>
      </div>
    </footer>
  );
}

export default Footer;

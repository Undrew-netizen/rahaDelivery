import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo.png';

const links = [
  { to: '/', label: 'Overview' },
  { to: '/services', label: 'Services' },
  { to: '/track-order', label: 'Track Delivery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

function NavBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/50 bg-[#f6f8f4]/85 backdrop-blur-xl">
      <div className="shell flex flex-wrap items-center justify-between gap-4 py-4">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Raha Delivery Logo" className="h-16 w-auto sm:h-20" />
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-slate-700">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition duration-300 ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/10'
                    : 'hover:bg-white/80 hover:text-emerald-800'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default NavBar;

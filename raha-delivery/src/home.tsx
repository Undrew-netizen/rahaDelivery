import { FaArrowRight, FaClock, FaMapMarkedAlt, FaPhoneAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const updates = [
  { title: 'Track in real time', copy: 'Watch each delivery move from pickup to final drop-off.' },
  { title: 'Talk to the team fast', copy: 'Reach support quickly if pickup notes or destinations change.' },
  { title: 'Stay on schedule', copy: 'Get clear ETAs for errands, meals, and parcel deliveries.' },
];

function Home() {
  return (
    <section className="page-section space-y-8">
      <div className="hero-card grid gap-8 px-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <p className="section-kicker">Delivery Home</p>
          <h1 className="section-title max-w-2xl">Everything important about your deliveries in one place.</h1>
          <p className="section-copy max-w-2xl">
            Use this space to jump into tracking, contact the team, or browse the services Raha offers across Homabay.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/track-order" className="primary-button">
              Track now
              <FaMapMarkedAlt />
            </Link>
            <Link to="/contact" className="secondary-button">
              Contact support
              <FaPhoneAlt />
            </Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-amber-300">Current promise</p>
              <p className="mt-2 text-3xl font-extrabold">Same-day service</p>
            </div>
            <FaClock className="text-3xl text-amber-300" />
          </div>
          <div className="mt-5 space-y-4">
            {updates.map((item) => (
              <div key={item.title} className="rounded-[1.25rem] bg-white p-4">
                <p className="font-bold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link to="/services" className="feature-card">
          <p className="text-lg font-bold text-slate-950">Browse services</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">See the errands, pickups, food runs, and parcel support available.</p>
          <p className="mt-4 inline-flex items-center gap-2 font-semibold text-emerald-700">
            Open services <FaArrowRight />
          </p>
        </Link>
        <Link to="/track-order" className="feature-card">
          <p className="text-lg font-bold text-slate-950">Follow your order</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">Check current location, rider information, and upcoming delivery stops.</p>
          <p className="mt-4 inline-flex items-center gap-2 font-semibold text-emerald-700">
            Open tracker <FaArrowRight />
          </p>
        </Link>
        <Link to="/about" className="feature-card">
          <p className="text-lg font-bold text-slate-950">Meet Raha</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">Learn more about the local team and what shapes the service.</p>
          <p className="mt-4 inline-flex items-center gap-2 font-semibold text-emerald-700">
            About the team <FaArrowRight />
          </p>
        </Link>
      </div>
    </section>
  );
}

export default Home;

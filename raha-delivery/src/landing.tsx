import {
  FaArrowRight,
  FaBoxOpen,
  FaClipboardCheck,
  FaClock,
  FaMapMarkedAlt,
  FaMotorcycle,
  FaShieldAlt,
  FaShoppingBasket,
  FaUtensils,
  FaWallet,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const services = [
  {
    icon: FaShoppingBasket,
    title: 'Shopping assistance',
    description: 'Groceries, household supplies, pharmacy pickups, and anything else from shops around Homabay.',
  },
  {
    icon: FaUtensils,
    title: 'Food delivery',
    description: 'Hot meals, drinks, and snacks brought quickly from your favorite local spots.',
  },
  {
    icon: FaBoxOpen,
    title: 'Parcel delivery',
    description: 'Safe drop-off and pickup for personal packages, store orders, and office items.',
  },
];

const steps = [
  'Tell us what you need picked up, delivered, or handled.',
  'We assign the nearest trusted rider and confirm the route.',
  'Track progress live as the rider moves from pickup to drop-off.',
  'Receive your delivery and pay through your preferred method.',
];

const highlights = [
  { icon: FaClock, title: 'Fast turnarounds', description: 'Most deliveries move within the hour.' },
  { icon: FaShieldAlt, title: 'Trusted riders', description: 'Locally vetted riders who know the town well.' },
  { icon: FaWallet, title: 'Clear pricing', description: 'Straightforward rates with no surprise charges.' },
];

function Landing() {
  return (
    <section className="page-section space-y-10 sm:space-y-14">
      <div className="hero-card overflow-hidden px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <span className="info-pill">Reliable errands across Homabay</span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Your trusted delivery partner for meals, parcels, and everyday errands.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Raha Delivery helps homes and businesses stay moving with fast pickups, real-time delivery updates, and friendly local riders who know Homabay.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/services" className="primary-button">
                Explore services
                <FaArrowRight />
              </Link>
              <Link to="/track-order" className="secondary-button">
                <FaMapMarkedAlt />
                Track a delivery
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-emerald-50 p-4">
                <p className="text-2xl font-extrabold text-emerald-800">60 min</p>
                <p className="text-sm text-slate-600">Average fast delivery window</p>
              </div>
              <div className="rounded-3xl bg-amber-50 p-4">
                <p className="text-2xl font-extrabold text-amber-700">6+</p>
                <p className="text-sm text-slate-600">Service types for daily errands</p>
              </div>
              <div className="rounded-3xl bg-slate-100 p-4">
                <p className="text-2xl font-extrabold text-slate-900">Live</p>
                <p className="text-sm text-slate-600">Status updates from pickup to drop-off</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-600">Today&apos;s delivery</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">RD-2408</p>
              </div>
              <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">
                In transit
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <FaMotorcycle className="text-xl text-amber-300" />
                  </div>
                  <div>
                    <p className="font-bold">Rider assigned</p>
                    <p className="text-sm text-white/70">Kevin is 7 minutes from pickup.</p>
                  </div>
                </div>
              </div>

              {steps.slice(0, 3).map((step, index) => (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                      0{index + 1}
                    </span>
                    {index < 2 && <span className="mt-2 h-full w-px bg-emerald-200" />}
                  </div>
                  <p className="pt-1 text-sm leading-7 text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3 text-center">
          <p className="section-kicker">What We Do</p>
          <h2 className="section-title">One service for all the errands that fill your day</h2>
          <p className="section-copy mx-auto max-w-2xl">
            From lunch orders to same-day parcel runs, Raha keeps homes and businesses on schedule.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, description }) => (
            <article key={title} className="feature-card">
              <div className="mb-4 inline-flex rounded-2xl bg-emerald-100 p-4 text-2xl text-emerald-800">
                <Icon />
              </div>
              <h3 className="text-xl font-bold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-card p-8">
          <p className="section-kicker">How It Works</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950">Fast, clear, and easy to follow</h2>
          <div className="mt-8 space-y-6">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 font-extrabold text-amber-700">
                  {index + 1}
                </div>
                <p className="pt-2 text-sm leading-7 text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-card p-8">
          <p className="section-kicker">Why Raha</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950">Built for the pace of everyday life in Homabay</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                <Icon className="text-2xl text-amber-500" />
                <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-card px-8 py-10 text-center sm:px-12">
        <p className="section-kicker">Ready To Start</p>
        <h2 className="mt-3 text-3xl font-extrabold text-slate-950 sm:text-4xl">
          Need something moved today?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
          Request a delivery, follow the route, and stay updated until it reaches your door.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/contact" className="primary-button">
            Start a request
            <FaClipboardCheck />
          </Link>
          <Link to="/track-order" className="secondary-button">
            Check delivery status
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Landing;

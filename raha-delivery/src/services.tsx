import {
  FaArrowRight,
  FaBolt,
  FaBoxOpen,
  FaClipboardCheck,
  FaCoffee,
  FaShoppingCart,
  FaTruck,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const services = [
  {
    icon: FaShoppingCart,
    title: 'Shopping assistance',
    description: 'Groceries, toiletries, hardware, and home essentials sourced from shops around Homabay.',
  },
  {
    icon: FaCoffee,
    title: 'Food delivery',
    description: 'Fresh meals and drinks from local restaurants delivered quickly to your door or office.',
  },
  {
    icon: FaBoxOpen,
    title: 'Parcel delivery',
    description: 'Reliable movement of gifts, documents, business items, and personal packages.',
  },
  {
    icon: FaBolt,
    title: 'Same-day delivery',
    description: 'Urgent orders handled on short timelines when timing matters most.',
  },
  {
    icon: FaClipboardCheck,
    title: 'Errand support',
    description: 'Queue handling, bill payments, document drop-offs, and other small tasks that consume your day.',
  },
  {
    icon: FaTruck,
    title: 'Custom pickups',
    description: 'Flexible, on-demand requests for unique delivery or pickup situations.',
  },
];

function Services() {
  return (
    <section className="page-section space-y-8">
      <div className="hero-card px-8 py-10 text-center sm:px-12">
        <p className="section-kicker">Our Services</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">Convenience, delivered with care</h1>
        <p className="section-copy mx-auto mt-4 max-w-3xl">
          Raha is designed for the errands people actually need help with every day. Pick the service that fits and we handle the route from there.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.map(({ icon: Icon, title, description }) => (
          <article key={title} className="feature-card flex h-full flex-col">
            <div className="mb-5 inline-flex w-fit rounded-2xl bg-emerald-100 p-4 text-2xl text-emerald-800">
              <Icon />
            </div>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{description}</p>
            <Link to="/contact" className="mt-6 inline-flex items-center gap-2 font-semibold text-emerald-700">
              Request service
              <FaArrowRight />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Services;

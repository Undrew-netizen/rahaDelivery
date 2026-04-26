import { FaBullseye, FaHeartbeat, FaMapMarkedAlt, FaRegHeart, FaUserFriends } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const values = [
  {
    icon: FaUserFriends,
    title: 'Community first',
    description: 'We hire locally, deliver locally, and design the service around how people in Homabay actually move through their day.',
  },
  {
    icon: FaHeartbeat,
    title: 'Care in every handoff',
    description: 'From food orders to important documents, every request is handled like it matters because it does.',
  },
  {
    icon: FaRegHeart,
    title: 'Trust built daily',
    description: 'Clear communication, fair pricing, and riders who understand the responsibility they carry.',
  },
];

function About() {
  return (
    <section className="page-section space-y-8">
      <div className="hero-card px-8 py-10 sm:px-12">
        <p className="section-kicker">About Raha</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950">
          A local delivery team built to return time back to busy people.
        </h1>
        <p className="section-copy mt-4 max-w-3xl">
          Raha Delivery started with a simple idea: errands should not consume the whole day. We built a local service that helps residents and businesses move faster without losing the personal touch.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="glass-card p-8">
          <FaBullseye className="text-3xl text-emerald-700" />
          <h2 className="mt-5 text-2xl font-extrabold text-slate-950">Our mission</h2>
          <p className="mt-3 text-sm leading-8 text-slate-600">
            To make everyday errands feel lighter by giving Homabay residents a dependable, affordable, and human-centered delivery service they can trust repeatedly.
          </p>
        </article>

        <article className="glass-card p-8">
          <FaMapMarkedAlt className="text-3xl text-amber-500" />
          <h2 className="mt-5 text-2xl font-extrabold text-slate-950">Our story</h2>
          <p className="mt-3 text-sm leading-8 text-slate-600">
            What began as a small local operation focused on a handful of riders has grown into a practical support system for families, professionals, students, and shops across town.
          </p>
        </article>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <p className="section-kicker">What We Stand For</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950">Values that shape every delivery</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <article key={title} className="feature-card">
              <Icon className="text-3xl text-emerald-700" />
              <h3 className="mt-5 text-xl font-bold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="hero-card px-8 py-10 text-center">
        <h2 className="text-3xl font-extrabold text-slate-950">See how Raha can support your next delivery</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
          Whether you need a quick parcel run or a full day of errand support, we are ready to help.
        </p>
        <div className="mt-8 flex justify-center">
          <Link to="/contact" className="primary-button">Talk to the team</Link>
        </div>
      </div>
    </section>
  );
}

export default About;

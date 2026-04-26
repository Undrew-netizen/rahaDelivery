import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaPhoneAlt,
  FaRoute,
  FaSearchLocation,
  FaStore,
  FaUser,
} from 'react-icons/fa';
import { apiRequest, getStoredToken, type DeliverySummary } from './lib/api';

function TrackOrder() {
  const [query, setQuery] = useState('');
  const [delivery, setDelivery] = useState<DeliverySummary | null>(null);
  const [message, setMessage] = useState('Sign in on the contact page first, then enter a real tracking code here.');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) {
      setError('You need to log in first so the backend can confirm you are allowed to view this delivery.');
      setDelivery(null);
      return;
    }

    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await apiRequest<{ delivery: DeliverySummary }>(`/deliveries/track/${query.trim().toUpperCase()}/`, {
        token,
      });
      setDelivery(response.delivery);
      setMessage(`Tracking ${response.delivery.tracking_code} loaded successfully.`);
    } catch (err) {
      setDelivery(null);
      setError(err instanceof Error ? err.message : 'Unable to load tracking details.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="page-section space-y-8">
      <div className="hero-card overflow-hidden px-8 py-10 sm:px-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <p className="section-kicker">Track Delivery</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Track real deliveries from the Django backend.
            </h1>
            <p className="section-copy max-w-2xl">
              Tracking now reads real data from the delivery API. Customers can follow their own deliveries and riders can check deliveries assigned to them after an admin creates their account.
            </p>

            <form onSubmit={handleSubmit} className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 rounded-full bg-white px-4 py-3">
                <FaSearchLocation className="text-emerald-700" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Enter tracking code"
                  className="w-full border-none bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
              <button type="submit" disabled={isBusy} className="primary-button border-none disabled:opacity-60">
                Check status
              </button>
            </form>

            {(message || error) && (
              <div className={`rounded-2xl p-4 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
                {error || message}
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-600">Live status</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">{delivery?.tracking_code ?? 'Waiting for lookup'}</p>
                <p className="mt-1 text-sm text-slate-500">{delivery?.service_type_label ?? 'No delivery loaded yet'}</p>
              </div>
              <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">
                {delivery?.status_label ?? 'Not loaded'}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-amber-300">ETA</p>
                    <p className="mt-2 text-3xl font-extrabold">
                      {delivery ? `${delivery.eta_minutes} mins` : '--'}
                    </p>
                  </div>
                  <FaClock className="text-3xl text-amber-300" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                  <span>Delivery progress</span>
                  <span>{delivery?.progress ?? 0}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-amber-400" style={{ width: `${delivery?.progress ?? 0}%` }} />
                </div>
              </div>

              <p className="rounded-[1.25rem] bg-white p-4 text-sm leading-7 text-slate-600">
                {delivery ? delivery.item_details : 'Item details and progress notes will appear here after a successful lookup.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Timeline</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-950">Backend delivery checkpoints</h2>
            </div>
            <FaRoute className="text-3xl text-emerald-700" />
          </div>

          <div className="mt-8 space-y-6">
            {(delivery?.checkpoints ?? []).length === 0 ? (
              <div className="rounded-[1.25rem] bg-white p-5 text-sm leading-7 text-slate-600">
                No tracking events loaded yet.
              </div>
            ) : (
              delivery?.checkpoints.map((checkpoint, index) => (
                <div key={`${checkpoint.label}-${index}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${checkpoint.done ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <FaCheckCircle />
                    </span>
                    {index < delivery.checkpoints.length - 1 && (
                      <span className={`mt-2 h-full w-px ${checkpoint.done ? 'bg-emerald-200' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  <div className="flex-1 rounded-[1.4rem] bg-white p-5">
                    <p className="text-lg font-bold text-slate-950">{checkpoint.label}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{checkpoint.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8">
            <p className="section-kicker">Order Details</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-[1.25rem] bg-white p-5">
                <p className="flex items-center gap-3 font-bold text-slate-950"><FaUser className="text-emerald-700" /> Recipient</p>
                <p className="mt-2 text-sm text-slate-600">{delivery?.recipient_name ?? '--'}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white p-5">
                <p className="flex items-center gap-3 font-bold text-slate-950"><FaStore className="text-emerald-700" /> Pickup</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{delivery?.pickup_address ?? '--'}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white p-5">
                <p className="flex items-center gap-3 font-bold text-slate-950"><FaMapMarkerAlt className="text-emerald-700" /> Destination</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{delivery?.dropoff_address ?? '--'}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8">
            <p className="section-kicker">Rider</p>
            <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <FaMotorcycle className="text-2xl text-amber-300" />
                </div>
                <div>
                  <p className="text-xl font-bold">{delivery?.rider?.name ?? 'Not assigned yet'}</p>
                  <p className="text-sm text-white/70">{delivery?.rider?.email ?? 'Admin will assign a rider in Django admin'}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white/90">
                <FaPhoneAlt className="text-amber-300" />
                {delivery?.rider?.phone_number ?? 'No rider phone available yet'}
              </div>
            </div>

            <div className="mt-5 rounded-[1.25rem] bg-amber-50 p-5">
              <p className="flex items-center gap-3 font-bold text-slate-950"><FaBoxOpen className="text-amber-600" /> Tracking note</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Tracking visibility is permission-aware. Customers see their own requests, riders see deliveries assigned to them, and admins can see every order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrackOrder;

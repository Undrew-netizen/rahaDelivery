import { useEffect, useMemo, useState } from 'react';
import { FaMotorcycle, FaRoute, FaShieldHalved, FaUserCheck } from 'react-icons/fa6';
import { apiRequest, clearStoredToken, getStoredToken, setStoredToken, type ApiUser, type DeliverySummary, type RiderSummary } from './lib/api';

type DeliveryEditState = {
  assigned_rider_id: string;
  status: string;
};

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
];

function Admin() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<ApiUser | null>(null);
  const [deliveries, setDeliveries] = useState<DeliverySummary[]>([]);
  const [riders, setRiders] = useState<RiderSummary[]>([]);
  const [deliveryEdits, setDeliveryEdits] = useState<Record<string, DeliveryEditState>>({});
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setDeliveries([]);
      setRiders([]);
      setDeliveryEdits({});
      return;
    }

    void loadAdminSession(token);
  }, [token]);

  async function loadAdminSession(activeToken: string) {
    try {
      const me = await apiRequest<{ user: ApiUser }>('/auth/me/', { token: activeToken });
      setUser(me.user);

      if (!me.user.is_staff) {
        setDeliveries([]);
        setRiders([]);
        setDeliveryEdits({});
        setError('This page is only available to admin and staff accounts.');
        return;
      }

      setError('');
      const list = await apiRequest<{ deliveries: DeliverySummary[] }>('/deliveries/', { token: activeToken });
      const riderList = await apiRequest<{ riders: RiderSummary[] }>('/deliveries/admin/riders/', { token: activeToken });
      setDeliveries(list.deliveries);
      setRiders(riderList.riders);
      setDeliveryEdits(
        Object.fromEntries(
          list.deliveries.map((delivery) => [
            delivery.tracking_code,
            {
              assigned_rider_id: String(delivery.rider?.id ?? ''),
              status: delivery.status,
            },
          ])
        )
      );
    } catch {
      clearStoredToken();
      setToken(null);
      setError('Your admin session has expired. Please log in again.');
    }
  }

  async function handleLogin() {
    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await apiRequest<{ token: string; user: ApiUser }>('/auth/login/', {
        method: 'POST',
        body: loginForm,
      });
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
      setMessage(`Welcome back, ${response.user.first_name || response.user.username}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogout() {
    if (token) {
      try {
        await apiRequest<{ detail: string }>('/auth/logout/', { method: 'POST', token });
      } catch {
        // Ignore logout cleanup failures.
      }
    }

    clearStoredToken();
    setToken(null);
    setUser(null);
    setDeliveries([]);
    setRiders([]);
    setDeliveryEdits({});
    setMessage('Signed out.');
    setError('');
  }

  function updateDeliveryEdit(trackingCode: string, patch: Partial<DeliveryEditState>) {
    setDeliveryEdits((current) => ({
      ...current,
      [trackingCode]: {
        assigned_rider_id: current[trackingCode]?.assigned_rider_id ?? '',
        status: current[trackingCode]?.status ?? 'pending',
        ...patch,
      },
    }));
  }

  async function handleAdminDeliveryUpdate(trackingCode: string) {
    if (!token || !user?.is_staff) {
      setError('Only staff accounts can manage delivery assignments.');
      return;
    }

    const edit = deliveryEdits[trackingCode];
    if (!edit) {
      return;
    }

    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await apiRequest<{ detail: string; delivery: DeliverySummary }>(`/deliveries/admin/${trackingCode}/update/`, {
        method: 'POST',
        token,
        body: {
          assigned_rider_id: edit.assigned_rider_id || null,
          status: edit.status,
        },
      });

      setDeliveries((current) =>
        current.map((delivery) => (delivery.tracking_code === trackingCode ? response.delivery : delivery))
      );
      setDeliveryEdits((current) => ({
        ...current,
        [trackingCode]: {
          assigned_rider_id: String(response.delivery.rider?.id ?? ''),
          status: response.delivery.status,
        },
      }));
      setMessage(response.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update delivery.');
    } finally {
      setIsBusy(false);
    }
  }

  const filteredDeliveries = useMemo(() => {
    const search = query.trim().toLowerCase();

    return [...deliveries]
      .sort((a, b) => {
        const aAssigned = Boolean(a.rider);
        const bAssigned = Boolean(b.rider);

        if (aAssigned !== bAssigned) {
          return aAssigned ? 1 : -1;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .filter((delivery) => {
        if (!search) {
          return true;
        }

        return [
          delivery.tracking_code,
          delivery.recipient_name,
          delivery.pickup_address,
          delivery.dropoff_address,
          delivery.rider?.name ?? '',
          delivery.status_label,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);
      });
  }, [deliveries, query]);

  const stats = useMemo(() => {
    const unassigned = deliveries.filter((delivery) => !delivery.rider).length;
    const active = deliveries.filter((delivery) => ['assigned', 'picked_up', 'in_transit'].includes(delivery.status)).length;
    const completed = deliveries.filter((delivery) => delivery.status === 'delivered').length;

    return { total: deliveries.length, unassigned, active, completed };
  }, [deliveries]);

  return (
    <section className="page-section space-y-8">
      <div className="hero-card overflow-hidden px-8 py-10 sm:px-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="section-kicker">Admin Dispatch Board</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Assign riders to deliveries from one focused screen
            </h1>
            <p className="section-copy mt-4 max-w-3xl">
              This page is for staff accounts. Log in, review incoming delivery requests, assign a rider, and update progress without going through the customer contact page.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="feature-card">
              <FaRoute className="text-2xl text-emerald-700" />
              <p className="mt-4 text-3xl font-extrabold text-slate-950">{stats.total}</p>
              <p className="mt-1 text-sm text-slate-600">Total deliveries</p>
            </article>
            <article className="feature-card">
              <FaMotorcycle className="text-2xl text-amber-500" />
              <p className="mt-4 text-3xl font-extrabold text-slate-950">{stats.unassigned}</p>
              <p className="mt-1 text-sm text-slate-600">Waiting for rider</p>
            </article>
            <article className="feature-card">
              <FaUserCheck className="text-2xl text-sky-600" />
              <p className="mt-4 text-3xl font-extrabold text-slate-950">{stats.active}</p>
              <p className="mt-1 text-sm text-slate-600">Active deliveries</p>
            </article>
            <article className="feature-card">
              <FaShieldHalved className="text-2xl text-emerald-700" />
              <p className="mt-4 text-3xl font-extrabold text-slate-950">{stats.completed}</p>
              <p className="mt-1 text-sm text-slate-600">Completed deliveries</p>
            </article>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="glass-card p-8">
          {!user ? (
            <div className="space-y-4">
              <div>
                <p className="section-kicker">Staff Login</p>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-950">Open the admin workspace</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Use an admin or staff account to access rider assignment controls.
                </p>
              </div>

              <input
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                placeholder="Admin email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              />
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                placeholder="Password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              />
              <button type="button" onClick={() => void handleLogin()} disabled={isBusy} className="primary-button w-full border-none disabled:opacity-60">
                Login to admin
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[1.5rem] bg-white p-6">
                <p className="section-kicker">Admin Session</p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  {user.first_name || user.username}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {user.is_staff
                    ? 'You can assign riders, update statuses, and monitor the queue here.'
                    : 'This account is logged in, but it does not have staff access to manage assignments.'}
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-6 text-sm leading-7 text-slate-600">
                <p><span className="font-bold text-slate-950">Email:</span> {user.email}</p>
                <p><span className="font-bold text-slate-950">Role:</span> {user.role}</p>
                <p><span className="font-bold text-slate-950">Staff access:</span> {user.is_staff ? 'Yes' : 'No'}</p>
                <p><span className="font-bold text-slate-950">Verified:</span> {user.email_verified ? 'Yes' : 'No'}</p>
              </div>

              <button type="button" onClick={() => void handleLogout()} className="secondary-button">
                Logout
              </button>
            </div>
          )}

          {(message || error) && (
            <div className={`mt-5 rounded-2xl p-4 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
              {error || message}
            </div>
          )}
        </div>

        <div className="glass-card p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Dispatch Queue</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-950">Deliveries ready for assignment</h2>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by tracking code, rider, address..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 sm:max-w-sm"
            />
          </div>

          <div className="mt-6 space-y-4">
            {!user?.is_staff ? (
              <div className="rounded-[1.25rem] bg-white p-5 text-sm leading-7 text-slate-600">
                Log in with a staff account to view and assign deliveries.
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="rounded-[1.25rem] bg-white p-5 text-sm leading-7 text-slate-600">
                No matching deliveries right now.
              </div>
            ) : (
              filteredDeliveries.map((delivery) => (
                <div key={delivery.tracking_code} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold text-slate-950">{delivery.tracking_code}</p>
                      <p className="mt-1 text-sm text-slate-600">{delivery.service_type_label}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      {delivery.status_label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 text-sm text-slate-600 lg:grid-cols-2">
                    <div>
                      <p className="font-semibold text-slate-950">Pickup</p>
                      <p className="mt-1 leading-7">{delivery.pickup_address}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Drop-off</p>
                      <p className="mt-1 leading-7">{delivery.dropoff_address}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Recipient</p>
                      <p className="mt-1">{delivery.recipient_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Current rider</p>
                      <p className="mt-1">{delivery.rider?.name ?? 'Not assigned yet'}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-[1.25rem] bg-slate-50 p-4 md:grid-cols-[1.2fr_1fr_auto]">
                    <select
                      value={deliveryEdits[delivery.tracking_code]?.assigned_rider_id ?? ''}
                      onChange={(event) => updateDeliveryEdit(delivery.tracking_code, { assigned_rider_id: event.target.value })}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                    >
                      <option value="">Unassigned rider</option>
                      {riders.map((rider) => (
                        <option key={rider.id} value={rider.id}>
                          {rider.name} ({rider.email})
                        </option>
                      ))}
                    </select>

                    <select
                      value={deliveryEdits[delivery.tracking_code]?.status ?? delivery.status}
                      onChange={(event) => updateDeliveryEdit(delivery.tracking_code, { status: event.target.value })}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => void handleAdminDeliveryUpdate(delivery.tracking_code)}
                      disabled={isBusy}
                      className="secondary-button whitespace-nowrap"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Admin;

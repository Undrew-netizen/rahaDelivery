import { useEffect, useState } from 'react';
import { FaEnvelope, FaLocationDot, FaLock, FaPhone, FaWhatsapp } from 'react-icons/fa6';
import { apiRequest, clearStoredToken, getStoredToken, setStoredToken, type ApiUser, type DeliverySummary, type RiderSummary } from './lib/api';

const serviceOptions = [
  { value: 'shopping', label: 'Shopping Assistance' },
  { value: 'food', label: 'Food Delivery' },
  { value: 'parcel', label: 'Parcel Delivery' },
  { value: 'same_day', label: 'Same-Day Delivery' },
  { value: 'errand', label: 'Errand Service' },
  { value: 'custom', label: 'Custom Pickup' },
];

const channels = [
  { icon: FaWhatsapp, title: 'WhatsApp', action: '+254 722 826 692' },
  { icon: FaEnvelope, title: 'Email', action: 'deliveryraha@gmail.com' },
  { icon: FaPhone, title: 'Phone', action: '0722 826 692' },
  { icon: FaLocationDot, title: 'Location', action: 'Homabay Town, Kenya' },
];

type AuthMode = 'register' | 'verify' | 'login';
type DeliveryEditState = {
  assigned_rider_id: string;
  status: string;
};

function Contact() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<ApiUser | null>(null);
  const [deliveries, setDeliveries] = useState<DeliverySummary[]>([]);
  const [riders, setRiders] = useState<RiderSummary[]>([]);
  const [deliveryEdits, setDeliveryEdits] = useState<Record<string, DeliveryEditState>>({});
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: '',
  });
  const [verifyForm, setVerifyForm] = useState({ email: '', code: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [deliveryForm, setDeliveryForm] = useState({
    service_type: 'shopping',
    recipient_name: '',
    recipient_phone: '',
    pickup_address: '',
    dropoff_address: '',
    item_details: '',
    customer_notes: '',
    eta_minutes: '60',
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
      setDeliveries([]);
      return;
    }

    void loadSession(token);
  }, [token]);

  async function loadSession(activeToken: string) {
    try {
      const me = await apiRequest<{ user: ApiUser }>('/auth/me/', { token: activeToken });
      setUser(me.user);
      const list = await apiRequest<{ deliveries: DeliverySummary[] }>('/deliveries/', { token: activeToken });
      setDeliveries(list.deliveries);

      if (me.user.is_staff) {
        const riderList = await apiRequest<{ riders: RiderSummary[] }>('/deliveries/admin/riders/', { token: activeToken });
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
      } else {
        setRiders([]);
        setDeliveryEdits(
          Object.fromEntries(
            list.deliveries.map((delivery) => [
              delivery.tracking_code,
              {
                assigned_rider_id: '',
                status: delivery.status,
              },
            ])
          )
        );
      }
    } catch {
      clearStoredToken();
      setToken(null);
    }
  }

  async function handleRegister() {
    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await apiRequest<{ detail: string }>('/auth/register/', {
        method: 'POST',
        body: registerForm,
      });
      setVerifyForm((current) => ({ ...current, email: registerForm.email }));
      setAuthMode('verify');
      setMessage(response.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerify() {
    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await apiRequest<{ detail: string; token: string; user: ApiUser }>('/auth/verify-otp/', {
        method: 'POST',
        body: verifyForm,
      });
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
      setMessage(response.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsBusy(false);
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

  async function handleResendOtp() {
    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await apiRequest<{ detail: string }>('/auth/resend-otp/', {
        method: 'POST',
        body: { email: verifyForm.email },
      });
      setMessage(response.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend code.');
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

  async function handleCreateDelivery() {
    if (!token) {
      setError('Create or verify an account first.');
      return;
    }

    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await apiRequest<{ detail: string; delivery: DeliverySummary }>('/deliveries/create/', {
        method: 'POST',
        token,
        body: deliveryForm,
      });
      setDeliveries((current) => [response.delivery, ...current]);
      setDeliveryForm({
        service_type: 'shopping',
        recipient_name: '',
        recipient_phone: '',
        pickup_address: '',
        dropoff_address: '',
        item_details: '',
        customer_notes: '',
        eta_minutes: '60',
      });
      setMessage(
        `${response.detail} Tracking code: ${response.delivery.tracking_code}. A notification was sent to deliveryraha@gmail.com and a copy was sent to ${user?.email}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create delivery.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="page-section space-y-8">
      <div className="hero-card px-8 py-10 sm:px-12">
        <p className="section-kicker">Accounts And Delivery Requests</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">Verify first-time users and send delivery details to the Raha inbox</h1>
        <p className="section-copy mt-4 max-w-3xl">
          New customers register with email OTP verification. After verification, they can submit delivery requests that are stored in Django and emailed to <span className="font-semibold text-emerald-800">deliveryraha@gmail.com</span>. Rider accounts are meant to be created by the admin inside Django admin.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card p-8">
          {!user ? (
            <>
              <div className="flex flex-wrap gap-3">
                {(['register', 'verify', 'login'] as AuthMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAuthMode(mode)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      authMode === mode ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    {mode === 'register' ? 'Create account' : mode === 'verify' ? 'Verify email' : 'Login'}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {authMode === 'register' && (
                  <>
                    <input value={registerForm.first_name} onChange={(event) => setRegisterForm({ ...registerForm, first_name: event.target.value })} placeholder="First name" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
                    <input value={registerForm.last_name} onChange={(event) => setRegisterForm({ ...registerForm, last_name: event.target.value })} placeholder="Last name" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
                    <input value={registerForm.phone_number} onChange={(event) => setRegisterForm({ ...registerForm, phone_number: event.target.value })} placeholder="Phone number" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
                    <input value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} placeholder="Email address" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
                    <input type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} placeholder="Password" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
                    <button type="button" onClick={() => void handleRegister()} disabled={isBusy} className="primary-button w-full border-none disabled:opacity-60">
                      Create account
                    </button>
                  </>
                )}

                {authMode === 'verify' && (
                  <>
                    <input value={verifyForm.email} onChange={(event) => setVerifyForm({ ...verifyForm, email: event.target.value })} placeholder="Email used during sign up" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
                    <input value={verifyForm.code} onChange={(event) => setVerifyForm({ ...verifyForm, code: event.target.value })} placeholder="6-digit OTP" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => void handleVerify()} disabled={isBusy} className="primary-button border-none disabled:opacity-60">
                        Verify email
                      </button>
                      <button type="button" onClick={() => void handleResendOtp()} disabled={isBusy} className="secondary-button">
                        Resend code
                      </button>
                    </div>
                  </>
                )}

                {authMode === 'login' && (
                  <>
                    <input value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="Email address" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
                    <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Password" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
                    <button type="button" onClick={() => void handleLogin()} disabled={isBusy} className="primary-button w-full border-none disabled:opacity-60">
                      Login
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[1.5rem] bg-white p-6">
                <p className="section-kicker">Account Active</p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  {user.first_name || user.username} is logged in
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  You can now submit delivery requests and track your recent activity without seeing the login form again until you sign out.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-6 text-sm leading-7 text-slate-600">
                <p><span className="font-bold text-slate-950">Email:</span> {user.email}</p>
                <p><span className="font-bold text-slate-950">Role:</span> {user.role}</p>
                <p><span className="font-bold text-slate-950">Verified:</span> {user.email_verified ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}

          {(message || error) && (
            <div className={`mt-5 rounded-2xl p-4 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
              {error || message}
            </div>
          )}

          <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <p className="flex items-center gap-3 text-lg font-bold"><FaLock className="text-amber-300" /> Rider accounts stay admin-only</p>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Customers can only create customer accounts here. Riders should be added by an admin in the Django admin panel and can then log in to view their assigned deliveries.
            </p>
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Delivery Form</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-950">
                {user ? `Logged in as ${user.first_name || user.username}` : 'Verify an account to submit a request'}
              </h2>
            </div>
            {user && (
              <button type="button" onClick={() => void handleLogout()} className="secondary-button">
                Logout
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <select value={deliveryForm.service_type} onChange={(event) => setDeliveryForm({ ...deliveryForm, service_type: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500">
              {serviceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input value={deliveryForm.eta_minutes} onChange={(event) => setDeliveryForm({ ...deliveryForm, eta_minutes: event.target.value })} placeholder="ETA minutes" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
            <input value={deliveryForm.recipient_name} onChange={(event) => setDeliveryForm({ ...deliveryForm, recipient_name: event.target.value })} placeholder="Recipient name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
            <input value={deliveryForm.recipient_phone} onChange={(event) => setDeliveryForm({ ...deliveryForm, recipient_phone: event.target.value })} placeholder="Recipient phone" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500" />
            <input value={deliveryForm.pickup_address} onChange={(event) => setDeliveryForm({ ...deliveryForm, pickup_address: event.target.value })} placeholder="Pickup address" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 sm:col-span-2" />
            <input value={deliveryForm.dropoff_address} onChange={(event) => setDeliveryForm({ ...deliveryForm, dropoff_address: event.target.value })} placeholder="Drop-off address" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 sm:col-span-2" />
            <textarea value={deliveryForm.item_details} onChange={(event) => setDeliveryForm({ ...deliveryForm, item_details: event.target.value })} placeholder="Item details" rows={4} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 sm:col-span-2" />
            <textarea value={deliveryForm.customer_notes} onChange={(event) => setDeliveryForm({ ...deliveryForm, customer_notes: event.target.value })} placeholder="Customer notes" rows={3} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 sm:col-span-2" />
          </div>

          <button type="button" onClick={() => void handleCreateDelivery()} disabled={isBusy || !user} className="primary-button mt-6 border-none disabled:opacity-60">
            Submit delivery request
          </button>

          <div className="mt-8 space-y-4">
            <p className="text-lg font-bold text-slate-950">
              {user?.is_staff ? 'Manage deliveries' : user?.role === 'rider' ? 'Assigned deliveries' : 'Recent deliveries'}
            </p>
            {deliveries.length === 0 ? (
              <div className="rounded-[1.25rem] bg-white p-5 text-sm leading-7 text-slate-600">
                No deliveries yet. Once you submit a request, the tracking code will appear here.
              </div>
            ) : (
              deliveries.slice(0, user?.is_staff ? deliveries.length : 4).map((delivery) => (
                <div key={delivery.tracking_code} className="rounded-[1.25rem] bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-bold text-slate-950">{delivery.tracking_code}</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{delivery.status_label}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{delivery.service_type_label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{delivery.pickup_address} to {delivery.dropoff_address}</p>
                  {user?.is_staff && (
                    <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
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
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="assigned">Assigned</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                      </select>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => void handleAdminDeliveryUpdate(delivery.tracking_code)}
                          disabled={isBusy}
                          className="secondary-button"
                        >
                          Save assignment and status
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {channels.map(({ icon: Icon, title, action }) => (
          <article key={title} className="feature-card">
            <div className="inline-flex rounded-2xl bg-emerald-100 p-4 text-2xl text-emerald-800">
              <Icon />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{action}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Contact;

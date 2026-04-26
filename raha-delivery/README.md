# Raha Delivery

This repo now contains:

- A Vite + React frontend for customer signup, OTP verification, delivery requests, and delivery tracking
- A Django backend for authentication, email OTP verification, admin-managed rider accounts, delivery storage, and email notifications

## Frontend

From the project root:

```bash
npm install
npm run dev
```

Set the API URL if needed:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Backend

From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Gmail OTP and delivery emails

The backend reads email settings from environment variables. Copy the values from [backend/.env.example](/c:/Users/..drew/Desktop/raha-delivery/raha-delivery/backend/.env.example:1) into your shell or deployment environment.

For Gmail SMTP you should use an App Password, not your normal Gmail password.

Important variables:

- `EMAIL_HOST_USER=deliveryraha@gmail.com`
- `EMAIL_HOST_PASSWORD=<gmail app password>`
- `DEFAULT_FROM_EMAIL=deliveryraha@gmail.com`
- `DELIVERY_NOTIFICATION_EMAIL=deliveryraha@gmail.com`

If you do not set these, Django will fall back to the console email backend during development.

## Rider Accounts

Rider accounts are intentionally not created from the frontend.

1. Sign in to Django admin at `/admin/`
2. Create a new user
3. Set `role` to `rider`
4. Optionally set `phone_number`
5. Save the user and share the login credentials with the rider

Admins can also assign riders to delivery requests in Django admin.

## Main API Endpoints

- `POST /api/auth/register/`
- `POST /api/auth/verify-otp/`
- `POST /api/auth/resend-otp/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `POST /api/auth/logout/`
- `GET /api/deliveries/`
- `POST /api/deliveries/create/`
- `GET /api/deliveries/track/<tracking_code>/`

## Verified Flow

1. Customer creates an account from the React contact page
2. Django sends a one-time password to the customer email
3. Customer verifies the OTP
4. Customer submits a delivery request
5. Django stores the delivery and emails the request details to `deliveryraha@gmail.com`
6. Admin can assign a rider in Django admin
7. Customer or assigned rider can track the delivery from the tracking page

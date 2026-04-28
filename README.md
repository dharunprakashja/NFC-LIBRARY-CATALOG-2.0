# NFC Library Attendance System

A combined NFC-based **attendance + library management** project with:
- Multiple Arduino sketches for NFC read/write and device flows
- Node.js backend (Express + MongoDB + Socket.IO)
- React frontend dashboard and user/admin interfaces

## Project Structure

- `arudino_attendance/` - attendance device sketch
- `arudino_book_logic/` - library/book logic sketch
- `arudino_to_backend/` - Arduino to backend integration sketch
- `BOTH_ATTENDANCE_AND_BOOK/` - combined flow sketch
- `WebApp/backend/` - REST API, DB, notifications, cron jobs
- `WebApp/frontend/` - React web application

## Prerequisites

- Node.js 18+
- npm
- MongoDB (local or MongoDB Atlas)
- Arduino IDE (for `.ino` files)

## Environment Setup (Backend)

Create or update `WebApp/backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000

# Twilio (optional, for SMS/WhatsApp notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_PHONE=+10000000000
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Gemini API keys (if using AI routes)
GEMINI_API_KEY_ADMIN=your_admin_gemini_key
USER_GEMINI_API_KEY=your_user_gemini_key

# Payment/Fine config (optional)
PAYMENT_PROVIDER=razorpay
RAZORPAY_PAYMENT_LINK_BASE=https://rzp.io/l/your_payment_link
UPI_PAYEE_VPA=library@upi
UPI_PAYEE_NAME=NFC Library
UPI_NOTE_PREFIX=Library Fine

# Serial ports (optional, defaults shown)
ATTENDANCE_DEVICE_PORT=COM11
BOOK_DEVICE_PORT=COM10
SERIAL_BAUD_RATE=2000000
SERIAL_PRESENCE_POLL_MS=3000
```

## Environment Setup (Frontend)

Create `WebApp/frontend/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

## Install Dependencies

From project root:

```bash
cd WebApp/backend
npm install

cd ../frontend
npm install
```

## Run the Application

Use two terminals.

### 1) Start Backend

```bash
cd WebApp/backend
npm start
```

Backend runs at `http://localhost:5000`.

### 2) Start Frontend

```bash
cd WebApp/frontend
npm start
```

Frontend runs at `http://localhost:3000` (default CRA port).

## Arduino Notes

- Open the required `.ino` sketch in Arduino IDE.
- Select the correct board and COM port.
- Upload firmware before testing web flows.
- Backend expects attendance/book devices on separate ports (configurable via `.env`).

## Important Security Note

Do **not** commit real secrets in `.env` files. If keys/tokens are already exposed, rotate them immediately.

## Troubleshooting

- MongoDB connection error:
  - Verify `MONGO_URI` in backend `.env`.
- Frontend cannot reach backend:
  - Verify `REACT_APP_API_BASE_URL` in frontend `.env`.
  - Ensure backend is running on the same host/port.
- Serial device not detected:
  - Check `ATTENDANCE_DEVICE_PORT` / `BOOK_DEVICE_PORT`.
  - Confirm device drivers and Arduino serial monitor conflicts.

## Scripts

### Backend (`WebApp/backend/package.json`)
- `npm start` - start server (`node server.js`)

### Frontend (`WebApp/frontend/package.json`)
- `npm start` - run React dev server
- `npm run build` - production build
- `npm test` - tests

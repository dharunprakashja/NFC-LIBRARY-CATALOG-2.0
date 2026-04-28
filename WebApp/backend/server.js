const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const ip = require('ip');
const mongoose = require('mongoose');
const { SerialPort } = require('serialport');
const connectDB = require('./config/db'); // MongoDB connection module
const sendNotifications = require('./controllers/notificationController');
const attendanceRoutes = require('./routes/attendance');
const geminiRoutes = require('./routes/gemini');
const signInRoutes = require('./routes/signin');
const libraryRoutes = require('./routes/library');
const bookRoutes = require('./routes/book_crud'); // Import Book routes
const studentRoutes = require('./routes/account_crud'); // Import Student routes
const { router: fineRoutes, sendAutomatedFineNotifications } = require('./routes/fines');
const updateAllStudentsFines = require('./cron/fineUpdater'); // Import fine updater
const morgan = require('morgan'); // Logging middleware
const cron = require('node-cron'); // Cron job scheduling
const path = require('path');
const admingeminiRoute = require('./routes/admin_ai'); // Import Gemini AI routes for admin
const usergeminiRoute = require('./routes/user_ai'); // Import Gemini AI routes for users



const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
});
const PORT = 5000;

const SERIAL_BAUD_RATE = Number(process.env.SERIAL_BAUD_RATE || 2000000);
const DEVICE_PORTS = {
  attendance: process.env.ATTENDANCE_DEVICE_PORT || 'COM11',
  book: process.env.BOOK_DEVICE_PORT || 'COM10',
};

const deviceStatus = {
  attendance: {
    type: 'attendance',
    mode: 'wired',
    port: DEVICE_PORTS.attendance,
    connected: false,
    lastSeen: null,
    error: null,
  },
  book: {
    type: 'book',
    mode: 'wired',
    port: DEVICE_PORTS.book,
    connected: false,
    lastSeen: null,
    error: null,
  },
};
const serialConnections = {
  attendance: { port: null, buffer: '' },
  book: { port: null, buffer: '' },
};

const normalizePort = (value) => String(value || '').trim().toUpperCase();
const SERIAL_PRESENCE_POLL_MS = Number(process.env.SERIAL_PRESENCE_POLL_MS || 3000);

const getDeviceStatusPayload = () => ({
  attendance: { ...deviceStatus.attendance },
  book: { ...deviceStatus.book },
});

const publishDeviceStatus = () => {
  io.emit('deviceStatus', getDeviceStatusPayload());
};

const setDeviceStatus = (key, updates) => {
  const next = {
    ...deviceStatus[key],
    ...updates,
  };

  const changed = JSON.stringify(next) !== JSON.stringify(deviceStatus[key]);
  deviceStatus[key] = next;

  if (changed) {
    publishDeviceStatus();
  }
};

const refreshSerialPresence = async () => {
  try {
    const ports = await SerialPort.list();
    const availablePorts = new Set(ports.map((p) => normalizePort(p.path)));

    ['attendance', 'book'].forEach((deviceKey) => {
      const configured = normalizePort(DEVICE_PORTS[deviceKey]);
      const physicallyPresent = availablePorts.has(configured);
      const isOpen = Boolean(serialConnections[deviceKey].port?.isOpen);

      setDeviceStatus(deviceKey, {
        connected: physicallyPresent,
        transport_ready: physicallyPresent && isOpen,
      });
    });
  } catch (error) {
    console.error('[Serial] Failed to list ports:', error?.message || error);
  }
};

const extractPayloadFromLine = (line) => {
  const trimmed = String(line || '').trim();
  if (!trimmed) return null;

  const firstBrace = trimmed.indexOf('{');
  const candidate = firstBrace >= 0 ? trimmed.slice(firstBrace) : trimmed;

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed.nfc_data === 'string' && parsed.nfc_data.trim()) {
      return { nfc_data: parsed.nfc_data.trim() };
    }
  } catch (error) {
    // Ignore JSON parse errors and fall back to plain-text handling.
  }

  if (candidate.includes('Student Details') || candidate.includes('Account Details') || candidate.includes('Book Details')) {
    return { nfc_data: candidate };
  }

  return null;
};

const resolveEndpointForPayload = (deviceKey) => {
  // Strict wired mapping requested:
  // attendance device (COM11) -> attendance flow only
  // book device (COM10) -> library flow only
  return deviceKey === 'attendance' ? '/attendance' : '/library';
};

const forwardSerialPayload = async (deviceKey, payload) => {
  const endpoint = resolveEndpointForPayload(deviceKey);

  try {
    const response = await axios.post(`http://127.0.0.1:${PORT}${endpoint}`, payload, {
      timeout: 6000,
    });

    setDeviceStatus(deviceKey, {
      lastSeen: new Date().toISOString(),
      error: null,
    });

    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'Failed to forward serial payload';
    setDeviceStatus(deviceKey, { error: message });
    console.error(`[Serial:${deviceKey}] Forward error:`, message);
    return null;
  }
};

const processSerialChunk = async (deviceKey, chunk) => {
  const state = serialConnections[deviceKey];
  state.buffer += chunk;

  let newlineIndex = state.buffer.indexOf('\n');
  while (newlineIndex >= 0) {
    const line = state.buffer.slice(0, newlineIndex).replace(/\r$/, '');
    state.buffer = state.buffer.slice(newlineIndex + 1);

    const payload = extractPayloadFromLine(line);
    if (payload) {
      await forwardSerialPayload(deviceKey, payload);
    }

    newlineIndex = state.buffer.indexOf('\n');
  }
};

const connectSerialDevice = (deviceKey) => {
  const configuredPort = DEVICE_PORTS[deviceKey];
  if (!configuredPort) return;

  const state = serialConnections[deviceKey];
  if (state.port && state.port.isOpen) return;

  const port = new SerialPort({
    path: configuredPort,
    baudRate: SERIAL_BAUD_RATE,
    autoOpen: false,
  });

  state.port = port;

  port.on('open', () => {
    console.log(`[Serial:${deviceKey}] Connected on ${configuredPort}`);
    setDeviceStatus(deviceKey, {
      connected: true,
      transport_ready: true,
      port: configuredPort,
      error: null,
    });
  });

  port.on('data', async (data) => {
    await processSerialChunk(deviceKey, data.toString('utf8'));
  });

  port.on('error', (error) => {
    const message = error?.message || 'Serial device error';
    console.error(`[Serial:${deviceKey}]`, message);
    setDeviceStatus(deviceKey, {
      connected: false,
      transport_ready: false,
      error: message,
    });
  });

  port.on('close', () => {
    console.warn(`[Serial:${deviceKey}] Disconnected from ${configuredPort}`);
    setDeviceStatus(deviceKey, {
      connected: false,
      transport_ready: false,
    });

    setTimeout(() => connectSerialDevice(deviceKey), 3000);
  });

  port.open((error) => {
    if (error) {
      setDeviceStatus(deviceKey, {
        connected: false,
        transport_ready: false,
        error: error.message,
      });
      setTimeout(() => connectSerialDevice(deviceKey), 3000);
    }
  });
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logs HTTP requests
// Add this line to include the route
app.use('/students', studentRoutes);
app.use('/image', express.static(path.join(__dirname, 'image'))
);// MongoDB Connection
connectDB(); // Connect to the MongoDB database

// Attach Socket.IO to req for WebSocket support in routes
app.use((req, res, next) => {
  req.io = io; // Attach io instance to the req object
  next();
});

// API Routes
app.use('/attendance', attendanceRoutes);
app.use('/account', signInRoutes);
app.use('/library', libraryRoutes);
app.use('/book', bookRoutes); // Add Book routes
app.use('/students', studentRoutes); // Add Student routes
app.use('/fines', fineRoutes);
app.use('/admin_ai', admingeminiRoute);
app.use('/user_ai', usergeminiRoute);
app.get('/device-status', (req, res) => {
  res.status(200).json(getDeviceStatusPayload());
});



// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// WebSocket Event Handlers
io.on('connection', (socket) => {
  console.log(' A new client connected:', socket.id);
  socket.emit('deviceStatus', getDeviceStatusPayload());

  socket.on('disconnect', () => {
    console.log(' Client disconnected:', socket.id);
  });

  // Example custom WebSocket event
  socket.on('customEvent', (data) => {
    console.log(' Received custom event:', data);
    io.emit('responseEvent', { message: 'Acknowledged', receivedData: data });
  });
});

// Notification Sending Logic
const initializeNotifications = async () => {
  try {
    console.log(' Sending notifications...');
    await sendNotifications(); // Call your notification controller
    console.log(' Notifications sent successfully');
  } catch (error) {
    console.error(' Failed to send notifications:', error.message);
  }
};

// Set up periodic notification sending (e.g., once a day at midnight using cron)
cron.schedule('0 0 * * *', () => {
  console.log('Sending daily notifications...');
  initializeNotifications();
});

// Set up daily fine updating (e.g., at midnight using cron)
cron.schedule('0 0 * * *', () => {
  console.log(' Updating student fines...');
  updateAllStudentsFines();
});

// Send automated fine reminders according to each member preferred channel.
cron.schedule('30 9 * * *', async () => {
  try {
    const results = await sendAutomatedFineNotifications();
    console.log(` Automated fine notifications processed: ${results.length}`);
  } catch (error) {
    console.error(' Automated fine notifications failed:', error.message);
  }
});

// Start the server
server.listen(PORT, () => {
  const serverIP = ip.address();
  console.log(`Server is running on http://${serverIP}:${PORT}`);
  console.log(`WebSocket server listening on ws://${serverIP}:${PORT}`);
  console.log(`Serial baud rate: ${SERIAL_BAUD_RATE}`);
  console.log(`Attendance wired port: ${DEVICE_PORTS.attendance}`);
  console.log(`Book wired port: ${DEVICE_PORTS.book}`);

  refreshSerialPresence();
  setInterval(refreshSerialPresence, SERIAL_PRESENCE_POLL_MS);

  connectSerialDevice('attendance');
  connectSerialDevice('book');

  // Trigger initial fine update and notification sending
  updateAllStudentsFines();
  initializeNotifications();
});

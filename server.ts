import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  clearAdminSessionCookie,
  createRateLimiter,
  createSessionToken,
  getAdminSessionFromRequest,
  requireAdmin,
  setAdminSessionCookie,
} from './server/auth.ts';
import {
  ConflictError,
  ValidationError,
  createBlockedSlot,
  createTransactionalBooking,
  deleteBlockedSlot,
  getPublicAvailableSlots,
  getPublicCatalog,
  listAdminBookings,
  listBlockedSlots,
  updateBookingStatus,
} from './server/bookingRepo.ts';
import { db, initDatabase, verifyPassword } from './server/db.ts';

const PORT = Number(process.env.PORT || 3000);
const IS_PROD =
  process.env.NODE_ENV === 'production' ||
  path.basename(process.argv[1] || '') === 'server.js';

initDatabase();

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

const bookingLimiter = createRateLimiter(20, 10 * 60 * 1000);
const loginLimiter = createRateLimiter(10, 15 * 60 * 1000);

// --- PUBLIC API ---

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/catalog', (_req, res) => {
  res.json(getPublicCatalog());
});

app.get('/api/slots', (req, res) => {
  try {
    const serviceId = String(req.query.serviceId || '');
    const barberId = String(req.query.barberId || 'any');
    const date = String(req.query.date || '');

    if (!serviceId || !date) {
      res.status(400).json({ error: 'Параметри serviceId та date обов’язкові.' });
      return;
    }

    const slots = getPublicAvailableSlots({ serviceId, barberId, date });
    res.json({ slots });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Помилка отримання вільного часу.' });
  }
});

app.post('/api/bookings', bookingLimiter, (req, res) => {
  try {
    const created = createTransactionalBooking({
      serviceId: String(req.body?.serviceId || ''),
      barberId: String(req.body?.barberId || 'any'),
      date: String(req.body?.date || ''),
      time: String(req.body?.time || ''),
      clientName: String(req.body?.clientName || ''),
      clientPhone: String(req.body?.clientPhone || ''),
      notes: req.body?.notes ? String(req.body.notes) : '',
    });

    res.status(201).json({ booking: created });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof ConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Внутрішня помилка при створенні запису.' });
  }
});

// --- ADMIN AUTHENTICATION ---

app.get('/api/admin/session', (req, res) => {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    res.json({ authenticated: false, user: null });
    return;
  }
  res.json({
    authenticated: true,
    user: {
      id: session.sub,
      username: session.username,
      displayName: session.displayName,
    },
  });
});

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    res.status(400).json({ error: 'Введіть логін та пароль.' });
    return;
  }

  const adminRow = db
    .prepare('SELECT id, username, password_hash, display_name FROM admin_users WHERE username = ?')
    .get(username) as
    | { id: string; username: string; password_hash: string; display_name: string }
    | undefined;

  if (!adminRow || !verifyPassword(password, adminRow.password_hash)) {
    res.status(401).json({ error: 'Невірний логін або пароль.' });
    return;
  }

  const token = createSessionToken({
    id: adminRow.id,
    username: adminRow.username,
    displayName: adminRow.display_name,
  });

  setAdminSessionCookie(req, res, token);
  res.json({
    authenticated: true,
    token,
    user: {
      id: adminRow.id,
      username: adminRow.username,
      displayName: adminRow.display_name,
    },
  });
});

app.post('/api/admin/logout', (req, res) => {
  clearAdminSessionCookie(req, res);
  res.json({ authenticated: false });
});

// --- PROTECTED ADMIN WORKSPACE API ---

app.get('/api/admin/bookings', requireAdmin, (req, res) => {
  try {
    const date = req.query.date ? String(req.query.date) : undefined;
    const barberId = req.query.barberId ? String(req.query.barberId) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;

    const bookings = listAdminBookings({ date, barberId, status });
    res.json({ bookings });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Не вдалося завантажити записи.' });
  }
});

app.patch('/api/admin/bookings/:id/status', requireAdmin, (req, res) => {
  try {
    const id = String(req.params.id || '');
    const status = String(req.body?.status || '') as
      | 'confirmed'
      | 'completed'
      | 'cancelled';

    const updated = updateBookingStatus(id, status);
    res.json({ booking: updated });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof ConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Не вдалося оновити статус запису.' });
  }
});

app.get('/api/admin/blocks', requireAdmin, (req, res) => {
  try {
    const date = req.query.date ? String(req.query.date) : undefined;
    const barberId = req.query.barberId ? String(req.query.barberId) : undefined;

    const blocks = listBlockedSlots({ date, barberId });
    res.json({ blocks });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Не вдалося завантажити блокування.' });
  }
});

app.post('/api/admin/blocks', requireAdmin, (req, res) => {
  try {
    const block = createBlockedSlot({
      barberId: String(req.body?.barberId || ''),
      date: String(req.body?.date || ''),
      startTime: String(req.body?.startTime || ''),
      endTime: String(req.body?.endTime || ''),
      reason: req.body?.reason ? String(req.body.reason) : undefined,
    });
    res.status(201).json({ block });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof ConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Не вдалося заблокувати години.' });
  }
});

app.delete('/api/admin/blocks/:id', requireAdmin, (req, res) => {
  try {
    const id = String(req.params.id || '');
    deleteBlockedSlot(id);
    res.json({ deleted: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Не вдалося видалити блокування.' });
  }
});

// Return JSON 404 for unknown /api routes before SPA fallback
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API маршрут не знайдено.' });
});

// --- VITE DEV / STATIC FRONTEND SERVING ---

async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Frontend build not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GENTLEMAN'S CLUB server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

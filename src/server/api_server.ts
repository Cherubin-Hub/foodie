import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DatabaseFactory } from '../db/db_index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Request logging middleware (res renamed to _res)
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// 1. License Check & Activation Endpoints
app.get('/api/license/status', async (_req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const status = await repo.getLicenseStatus();
  res.json(status);
});

app.post('/api/license/activate', async (req: Request, res: Response) => {
  const { licenseKey } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ success: false, message: 'License key is required.' });
  }
  const repo = DatabaseFactory.getRepository();
  const result = await repo.activateLicense(licenseKey);
  res.json(result);
});

// 2. Authentication & Guest Session Endpoints
app.post('/api/auth/guest', async (req: Request, res: Response) => {
  const { temporaryName } = req.body;
  if (!temporaryName || !temporaryName.trim()) {
    return res.status(400).json({ success: false, message: 'Temporary name is required.' });
  }
  const repo = DatabaseFactory.getRepository();
  const session = await repo.createGuestSession(temporaryName);
  res.json(session);
});

// 3. Home Menu Bundled CQRS Rendering Endpoint
app.get('/api/home', async (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'GUEST';
  const guestToken = (req.query.guestToken as string) || undefined;
  const repo = DatabaseFactory.getRepository();
  const payload = await repo.renderHomePage(role, guestToken);
  res.json(payload);
});

// 4. Order Management Endpoints
app.post('/api/orders', async (req: Request, res: Response) => {
  const { userId, guestSessionToken, guestTemporaryName, orderType, promoCode, deliveryAddress, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }

  const repo = DatabaseFactory.getRepository();
  const result = await repo.placeOrder({
    user_id: userId,
    guest_session_token: guestSessionToken,
    guest_temporary_name: guestTemporaryName,
    order_type: orderType || 'DINE_IN',
    promo_code: promoCode,
    delivery_address: deliveryAddress,
    items
  });

  res.json(result);
});

app.get('/api/orders/track/:token', async (req: Request, res: Response) => {
  // Normalize string | string[] param from Express 5 types
  const token = (Array.isArray(req.params.token) ? req.params.token[0] : req.params.token) as string;
  const repo = DatabaseFactory.getRepository();
  const order = await repo.getOrderByToken(token);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order tracking token not found.' });
  }
  res.json({ success: true, order });
});

app.get('/api/admin/orders', async (_req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const orders = await repo.getAllOrders();
  res.json({ success: true, orders });
});

app.put('/api/admin/orders/:id/status', async (req: Request, res: Response) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;
  const repo = DatabaseFactory.getRepository();
  const result = await repo.updateOrderStatus(orderId, status);
  res.json(result);
});

// 5. Admin RBAC Matrix Endpoints
app.get('/api/admin/rbac', async (_req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const matrix = await repo.getRoleModuleMatrix();
  res.json({ success: true, matrix });
});

app.post('/api/admin/rbac/toggle', async (req: Request, res: Response) => {
  const { roleCode, moduleCode, field, value } = req.body;
  const repo = DatabaseFactory.getRepository();
  const result = await repo.toggleRoleModulePermission(roleCode, moduleCode, field, value);
  res.json(result);
});

// 6. Admin Store Branding & Catalog Endpoints
app.put('/api/admin/branding', async (req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const result = await repo.updateStoreBranding(req.body);
  res.json(result);
});

app.post('/api/admin/catalog/item', async (req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const result = await repo.createOrUpdateFoodItem(req.body);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`[API] Express Server listening on port ${PORT} (Provider: ${process.env.DB_PROVIDER || 'supabase'})`);
});
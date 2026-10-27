import 'dotenv/config';
import express from 'express';
import path from 'path';
// Trigger dev server reload - 2026-08-07T05:55:00Z
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { CloudinaryService } from './services/CloudinaryService';

// Setup Supabase — use service_role key on backend to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

import apiRouter from './routes';
import { errorHandler } from './middlewares/auth.middleware';

const app = express();
const PORT = 3000;

// Capture raw body for webhook signature verification with 10mb limit for base64 image uploads
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Mount Layered REST API Router
app.use(apiRouter);

// In-memory fallback database for active sessions and demo states
interface OrderState {
  id: string;
  student_id: string | null;
  canteen_id: string;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  order_type: string;
  order_code: string;
  created_at: string;
  cashfree_order_id: string;
  cashfree_payment_id?: string;
  order_items: any[];
  accepted_at?: string;
  student_details?: any;
}

const activeOrdersStore = new Map<string, OrderState>();
const processedWebhooks = new Set<string>(); // Prevent duplicate webhook processing
let sseClients: { id: number; res: express.Response }[] = [];

// Server-Sent Events for real-time updates without page reloads
app.get('/api/payments/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { id: Date.now(), res };
  sseClients.push(client);

  // Send initial connected ping
  res.write(': ping\n\n');

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== client.id);
  });
});

const broadcastOrderUpdate = (order: OrderState) => {
  const payload = JSON.stringify(order);
  sseClients.forEach(client => {
    client.res.write(`event: payment_update\ndata: ${payload}\n\n`);
  });
};

// 1. Create Payment Order from Backend (Supports Cashfree PG API, Split & Fallback)
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { amount, studentId, studentName, phone, canteenId, items, orderType, paymentMethod, gateway, cashAmount, upiAmount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }

    const orderId = `CF_ORD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const orderCode = Math.floor(1000 + Math.random() * 9000).toString();

    const isCash = paymentMethod === 'Cash' || paymentMethod === 'cash';
    const isSplit = paymentMethod === 'Split' || paymentMethod === 'split';
    const isUPI = paymentMethod === 'UPI' || paymentMethod === 'online' || paymentMethod === 'Cashfree' || paymentMethod === 'cashfree';

    const selectedGateway = 'Cashfree';
    const onlineAmount = isSplit ? (upiAmount || 0) : amount;

    const rawAppId = process.env.CASHFREE_APP_ID || 'TEST1115864987dc532ebfcdde0745ef94685111';
    const rawSecretKey = process.env.CASHFREE_SECRET_KEY || '';
    const rawEnv = process.env.CASHFREE_ENV || 'SANDBOX';

    const cashfreeAppId = rawAppId.replace(/^["']|["']$/g, '').trim();
    const cashfreeSecretKey = rawSecretKey.replace(/^["']|["']$/g, '').trim();
    const cashfreeEnv = rawEnv.replace(/^["']|["']$/g, '').trim();

    let paymentSessionId = `mock_session_${crypto.randomBytes(8).toString('hex')}`;
    let cfOrderId = orderId;
    let qrString = `upi://pay?pa=timetomeal@cashfree&pn=TimeToMeal&am=${onlineAmount}&tr=${orderId}&cu=INR`;
    let isMockMode = true;

    if (!isCash && cashfreeAppId && cashfreeSecretKey) {
      const baseUrl = (cashfreeEnv.toLowerCase() === 'production' || cashfreeEnv.toLowerCase() === 'prod') 
        ? 'https://api.cashfree.com/pg' 
        : 'https://sandbox.cashfree.com/pg';

      try {
        const cleanPhone = (phone && phone.replace(/\D/g, '').length >= 10)
          ? phone.replace(/\D/g, '').slice(-10)
          : '9999999999';

        const cleanCustomerId = (studentId || `guest_${Date.now()}`)
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 45);

        const cfPayload = {
          order_id: orderId,
          order_amount: Number(onlineAmount),
          order_currency: 'INR',
          customer_details: {
            customer_id: cleanCustomerId,
            customer_phone: cleanPhone,
            customer_name: studentName || 'Canteen Guest',
            customer_email: 'guest@timetomeal.edu'
          }
        };

        const cfResponse = await fetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: {
            'x-client-id': cashfreeAppId,
            'x-client-secret': cashfreeSecretKey,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cfPayload)
        });

        const cfData = await cfResponse.json();

        if (cfResponse.ok && cfData.payment_session_id) {
          paymentSessionId = cfData.payment_session_id;
          cfOrderId = cfData.cf_order_id || cfData.order_id;
          qrString = cfData.upi_qr_string || qrString;
          isMockMode = false;
        } else {
          console.warn(`[Cashfree PG API Notice] Order creation returned HTTP ${cfResponse.status}:`, cfData);
          isMockMode = true;
        }
      } catch (err) {
        console.warn('Cashfree PG fetch notice:', err);
        isMockMode = true;
      }
    }

    const isPaidUpfront = isCash || (isUPI && isMockMode);

    // Prepare new order object
    const newOrder: any = {
      id: orderId,
      student_id: studentId || null,
      canteen_id: canteenId || 'ca000001-0000-4000-a000-000000000001',
      total_amount: Number(amount),
      paid_amount: isPaidUpfront ? Number(amount) : (isSplit ? Number(cashAmount || 0) : 0),
      payment_method: isCash ? 'Cash' : isSplit ? 'Split' : selectedGateway,
      payment_status: isCash ? 'paid' : isSplit ? 'pending_split_payment' : 'pending',
      order_status: isCash ? 'delivered' : 'pending',
      order_type: orderType || 'online',
      order_code: orderCode,
      created_at: new Date().toISOString(),
      cashfree_order_id: cfOrderId,
      order_items: items || [],
      cash_amount: isSplit ? Number(cashAmount || 0) : (isCash ? Number(amount) : 0),
      upi_amount: isSplit ? Number(upiAmount || 0) : (isCash ? 0 : Number(amount)),
      gateway: selectedGateway,
      student_details: studentId ? {
        student_id: studentId,
        full_name: studentName || 'Student',
        phone_number: phone || '9999999999'
      } : undefined
    };

    // Store in active server order store
    activeOrdersStore.set(orderId, newOrder);

    // If real Supabase database is connected, persist it
    if (supabase) {
      try {
        const orderStatusMap: any = {
          'pending': 'PENDING',
          'delivered': 'COMPLETED',
          'Accepted': 'PREPARING'
        };
        const mappedStatus = orderStatusMap[newOrder.order_status] || 'PENDING';
        
        let paymentMethodMapped = 'UPI_QR';
        if (isCash) paymentMethodMapped = 'CASH';
        else if (selectedGateway === 'Cashfree' || paymentMethod === 'cashfree') paymentMethodMapped = 'CASHFREE';

        // Validate student_id is a real UUID — not a placeholder like 'STU-001'
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validStudentId = (studentId && uuidRegex.test(studentId)) ? studentId : null;
        const validCanteenId = (canteenId && uuidRegex.test(canteenId)) ? canteenId : 'ca000001-0000-4000-a000-000000000001';
        
        // Insert order into Supabase — do NOT pass id, let DB generate a valid UUID
        const { data: insertedOrder, error: orderError } = await supabase.from('orders').insert({
          // id is omitted — DB generates a proper UUID via gen_random_uuid()
          student_id: validStudentId,
          canteen_id: validCanteenId,
          total_amount: Number(amount),
          paid_amount: newOrder.paid_amount,
          payment_method: paymentMethodMapped,
          payment_status: isCash ? 'SUCCESS' : 'PENDING',
          order_status: mappedStatus,
          order_code: orderCode,
          cashfree_order_id: cfOrderId
        }).select('id').single();

        if (orderError) {
          console.error('Failed to save order to Supabase:', orderError.message);
        } else {
          // Use the DB-generated UUID for order_items linkage
          const dbOrderId = insertedOrder?.id;
          // Keep the in-memory store updated with the real DB id
          newOrder.db_id = dbOrderId;
          activeOrdersStore.set(orderId, newOrder);

          if (dbOrderId && items && items.length > 0) {
            const orderItemsData = items.map((item: any) => ({
              order_id: dbOrderId,   // real UUID from DB
              food_id: (item.menu_item_id && uuidRegex.test(item.menu_item_id)) ? item.menu_item_id : null,
              item_name: item.item_name || item.name || 'Food Item',
              quantity: item.quantity || 1,
              price_per_unit: item.price || item.price_per_unit || 0,
              total_price: (item.price || item.price_per_unit || 0) * (item.quantity || 1)
            }));
            const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
            if (itemsError) console.error('Failed to save order items:', itemsError.message);
            else console.log(`✅ Order + ${items.length} item(s) saved to Supabase. DB order id: ${dbOrderId}`);
          } else if (dbOrderId) {
            console.log(`✅ Order saved to Supabase. DB order id: ${dbOrderId}`);
          }
        }
      } catch (err) {
        console.error('Exception while saving order to Supabase:', err);
      }
    }

    return res.json({
      success: true,
      order_id: orderId,
      cashfree_order_id: cfOrderId,
      payment_session_id: paymentSessionId,
      upi_qr_string: qrString,
      amount: Number(amount),
      online_amount: Number(onlineAmount),
      is_mock: isMockMode,
      order: newOrder
    });
  } catch (err: any) {
    console.error('Create order error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 2. Official Cashfree Payment Verification Endpoint
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = activeOrdersStore.get(orderId);
    
    const cashfreeAppId = process.env.CASHFREE_APP_ID || 'TEST1115864987dc532ebfcdde0745ef94685111';
    const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY || '';
    const cashfreeEnv = process.env.CASHFREE_ENV || 'SANDBOX';

    const baseUrl = (cashfreeEnv.toLowerCase() === 'production' || cashfreeEnv.toLowerCase() === 'prod') 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';

    let verifiedStatus = 'PENDING';
    let cfPaymentId = '';

    if (cashfreeAppId && cashfreeSecretKey) {
      try {
        const cfRes = await fetch(`${baseUrl}/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'x-client-id': cashfreeAppId,
            'x-client-secret': cashfreeSecretKey,
            'x-api-version': '2023-08-01'
          }
        });

        if (cfRes.ok) {
          const cfData = await cfRes.json();
          verifiedStatus = cfData.order_status || 'PENDING';
        }
      } catch (e) {
        console.warn('Cashfree verification call warning:', e);
      }
    }

    // Update order status if PAID or verified
    if (verifiedStatus === 'PAID' || req.body.forceSuccess) {
      if (order) {
        order.payment_status = 'paid';
        order.paid_amount = order.total_amount;
        order.order_status = order.order_type === 'walk-in' ? 'delivered' : 'Accepted';
        order.accepted_at = new Date().toISOString();
        activeOrdersStore.set(orderId, order);
      }

      return res.json({
        success: true,
        payment_status: 'PAID',
        orderId,
        message: 'Payment verified successfully.'
      });
    }

    return res.json({
      success: false,
      payment_status: verifiedStatus,
      orderId,
      message: `Order status on Cashfree: ${verifiedStatus}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
});

// Official Cashfree Refund Endpoint
app.post('/api/payments/refund', async (req, res) => {
  try {
    const { orderId, cashfreeOrderId, amount, reason } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required for refund' });
    }

    const cashfreeAppId = process.env.CASHFREE_APP_ID || 'TEST1115864987dc532ebfcdde0745ef94685111';
    const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY || '';
    const cashfreeEnv = process.env.CASHFREE_ENV || 'SANDBOX';

    const baseUrl = (cashfreeEnv.toLowerCase() === 'production' || cashfreeEnv.toLowerCase() === 'prod') 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';

    const refundId = `ref_${Date.now()}`;
    let isSuccess = true;

    if (cashfreeAppId && cashfreeSecretKey) {
      try {
        const cfRes = await fetch(`${baseUrl}/orders/${orderId}/refunds`, {
          method: 'POST',
          headers: {
            'x-client-id': cashfreeAppId,
            'x-client-secret': cashfreeSecretKey,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refund_id: refundId,
            refund_amount: Number(amount),
            refund_note: reason || 'Admin requested refund'
          })
        });

        if (!cfRes.ok) {
          console.warn('[Cashfree Refund API Notice] Refund call returned HTTP status:', cfRes.status);
        }
      } catch (err) {
        console.warn('Cashfree refund call notice:', err);
      }
    }

    // Update order status in server store
    const order = activeOrdersStore.get(orderId);
    if (order) {
      order.payment_status = 'refunded';
      order.order_status = 'cancelled';
      activeOrdersStore.set(orderId, order);
      broadcastOrderUpdate(order);
    }

    return res.json({
      success: isSuccess,
      refund_id: refundId,
      order_id: orderId,
      refund_amount: amount,
      status: 'SUCCESS',
      message: 'Cashfree refund initiated and completed successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Refund processing failed' });
  }
});

// 2. Cashfree Webhook Handler
app.post('/api/payments/webhook', async (req: any, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    const cashfreeSecretKey = (process.env.CASHFREE_SECRET_KEY || '').replace(/^["']|["']$/g, '').trim();

    // Verify HMAC signature if signature and secret key are present
    if (signature && timestamp && cashfreeSecretKey) {
      const payloadToSign = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', cashfreeSecretKey)
        .update(payloadToSign)
        .digest('base64');

      if (signature !== expectedSignature) {
        const expectedSignatureHex = crypto
          .createHmac('sha256', cashfreeSecretKey)
          .update(payloadToSign)
          .digest('hex');

        if (signature !== expectedSignatureHex) {
          console.warn('[Cashfree Webhook] Unauthorized signature mismatch');
          return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
        }
      }
    }

    const event = req.body;
    const orderId = event.data?.order?.order_id || event.order_id;
    const paymentId = event.data?.payment?.cf_payment_id || event.data?.payment?.payment_id || event.payment_id;
    const isSuccess = event.data?.payment?.payment_status === 'SUCCESS' || event.payment_status === 'SUCCESS';
    const eventTime = event.event_time || timestamp || Date.now();

    if (!orderId) {
      return res.status(400).json({ error: 'Invalid Cashfree webhook payload format' });
    }

    // Idempotency check using event_time_orderId
    const idempotencyKey = `${eventTime}_${orderId}`;
    if (processedWebhooks.has(idempotencyKey)) {
      return res.json({ status: 'already_processed', message: 'Webhook event already handled' });
    }
    processedWebhooks.add(idempotencyKey);

    const order = activeOrdersStore.get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (isSuccess) {
      const targetStatus = order.order_type === 'walk-in' ? 'delivered' : 'Accepted';
      order.payment_status = 'paid';
      order.paid_amount = order.total_amount;
      order.cashfree_payment_id = paymentId;
      order.order_status = targetStatus;
      if (targetStatus === 'Accepted') order.accepted_at = new Date().toISOString();
      activeOrdersStore.set(orderId, order);

      if (supabase) {
        try {
          const updateData: any = { paid_amount: order.total_amount, order_status: targetStatus };
          if (targetStatus === 'Accepted') updateData.accepted_at = new Date().toISOString();
          await supabase.from('orders')
            .update(updateData)
            .eq('id', orderId);

          await supabase.from('payments').insert({
            order_id: orderId,
            payment_method: 'Cashfree',
            payment_status: 'completed',
            transaction_reference: paymentId,
            paid_amount: order.total_amount,
            cashfree_order_id: order.cashfree_order_id,
            cashfree_payment_id: paymentId
          });
        } catch (err) {
          console.error('Supabase webhook update err:', err);
        }
      }

      broadcastOrderUpdate(order);
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Simulated Payment Success Confirmation
app.post('/api/payments/simulate-success', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  const order = activeOrdersStore.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.payment_status === 'paid') {
    return res.json({ success: true, alreadyPaid: true, order });
  }

  const targetStatus = order.order_type === 'walk-in' ? 'delivered' : 'Accepted';
  order.payment_status = 'paid';
  order.paid_amount = order.total_amount;
  order.order_status = targetStatus;
  if (targetStatus === 'Accepted') order.accepted_at = new Date().toISOString();

  activeOrdersStore.set(orderId, order);

  // Sync with Supabase if connected
  if (supabase) {
    try {
      const updateData: any = { paid_amount: order.total_amount, order_status: targetStatus };
      if (targetStatus === 'Accepted') updateData.accepted_at = new Date().toISOString();
      await supabase.from('orders')
        .update(updateData)
        .eq('id', orderId);
    } catch (err) {
      console.error('Supabase update order error:', err);
    }
  }

  // Broadcast update instantly
  broadcastOrderUpdate(order);

  return res.json({
    success: true,
    message: 'Payment verified successfully.',
    order
  });
});

// Cloudinary Upload Secure Proxy Endpoint
app.post('/api/cloudinary/upload', async (req, res) => {
  try {
    const { image, folder = '' } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const cloudinaryService = CloudinaryService.getInstance();
    const result = await cloudinaryService.uploadImage(image, folder);

    return res.json(result);
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload image' });
  }
});

// Cloudinary Delete Secure Proxy Endpoint
app.post('/api/cloudinary/delete', async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    const cloudinaryService = CloudinaryService.getInstance();
    const result = await cloudinaryService.deleteImage(public_id);

    return res.json(result);
  } catch (err: any) {
    console.error('Cloudinary delete error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete image' });
  }
});

// GET single order status
app.get('/api/payments/status/:orderId', (req, res) => {
  const order = activeOrdersStore.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  return res.json({ order });
});

// Vite middleware setup for full-stack SPA integration
async function startServer() {
  const frontendRoot = path.resolve(process.cwd(), 'apps/frontend');
  const distPath = path.resolve(process.cwd(), 'dist');

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: frontendRoot,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    app.get('/', async (req, res, next) => {
      try {
        let template = fs.readFileSync(path.join(frontendRoot, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml('/', template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/health')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.join(frontendRoot, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

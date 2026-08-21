import { Router } from 'express';
import { InvoiceController } from '../controllers/InvoiceController';
import { authMiddleware, adminOnly } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// ── Static routes ─────────────────────────────────────────────────────────────
// ⚠️  ORDERING RULE: Static paths MUST be declared before dynamic /:id routes.
// Express matches routes in declaration order; a static path placed after /:id
// would be silently captured as an ID parameter.

// POST /invoices — employee submits invoice image
router.post(
  '/',
  authMiddleware,
  uploadMiddleware.single('image'),
  InvoiceController.submit,
);

// POST /invoices/ai-result — internal webhook called by the Python AI service
// (protected via X-AI-Secret header, not JWT)
router.post('/ai-result', InvoiceController.receiveAiResult);

// GET /invoices — admin lists all invoices (paginated)
router.get('/', authMiddleware, adminOnly, InvoiceController.list);

// GET /invoices/flagged — admin views anomalous invoices
router.get('/flagged', authMiddleware, adminOnly, InvoiceController.listFlagged);

// GET /invoices/monthly-totals — data for ECharts area chart
router.get('/monthly-totals', authMiddleware, adminOnly, InvoiceController.monthlyTotals);

// ── Dynamic routes (:id must come last) ──────────────────────────────────────

// GET /invoices/:id
router.get('/:id', authMiddleware, InvoiceController.getById);

// PATCH /invoices/:id/review — admin approves/rejects
router.patch('/:id/review', authMiddleware, adminOnly, InvoiceController.adminReview);

export default router;

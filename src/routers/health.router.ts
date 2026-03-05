import { Router } from 'express';
import { healthCheck } from '../middleware/health.middleware';

const router = Router();
router.get('/', healthCheck);
export default router;

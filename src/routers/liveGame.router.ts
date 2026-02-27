import { Router } from 'express';
import { listLiveGames } from '../controllers/Livegame.controller';
import { isAuthenticated } from '../middleware/auth.middleware';

const router = Router();

router.use(isAuthenticated);
router.get('/', listLiveGames);  

export default router;

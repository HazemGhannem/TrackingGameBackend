import { Router } from 'express';
import { listLiveGames,deleteLiveGames } from '../controllers/Livegame.controller';
import { isAuthenticated } from '../middleware/auth.middleware';

const router = Router();

router.use(isAuthenticated);
router.get('/', listLiveGames);  
router.delete('/delete/:playerId', deleteLiveGames);  

export default router;

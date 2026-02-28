import { Router } from 'express';
import { add,list,listFavoriteIds,remove } from '../controllers/favorite.controller';
import { isAuthenticated } from '../middleware/auth.middleware';

const router = Router();

router.use(isAuthenticated);

router.get('/show', list);  
router.post('/add', add); 
router.delete('/:favoriteId', remove);
router.get('/ids', listFavoriteIds);

export default router;

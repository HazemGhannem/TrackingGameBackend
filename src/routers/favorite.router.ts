import { Router } from 'express';
import { add,list,remove } from '../controllers/favorite.controller';
import { isAuthenticated } from '../middleware/auth.middleware';

const router = Router();

router.use(isAuthenticated);

router.get('/show', list);  
router.post('/add', add); 
router.delete('/:favoriteId', remove);

export default router;

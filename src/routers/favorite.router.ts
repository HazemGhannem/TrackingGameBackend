import { Router } from 'express';
import { add,list,remove } from '../controllers/favorite.controller';

const router = Router();



router.get('/show/:userId', list);  
router.post('/add', add); 
router.delete('/:favoriteId', remove);

export default router;

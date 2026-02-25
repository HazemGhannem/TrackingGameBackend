import { Router } from 'express';
import { fetchAccount, fetchPlayerProfile } from '../controllers/riot.controller';

const router = Router();

router.get('/account', fetchAccount);
router.get('/player/:region/:platform/:puuid', fetchPlayerProfile);

export default router;

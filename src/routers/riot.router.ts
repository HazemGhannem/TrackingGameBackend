import { Router } from 'express';
import {  fetchPlayerProfile } from '../controllers/riot.controller';

const router = Router();

router.get('/player/:name/:tag', fetchPlayerProfile);

export default router;

import { Router } from 'express';
import {  fetchPlayerProfile } from '../controllers/riot.controller';

const router = Router();

router.get('/player/:routingRegion/:name/:tag', fetchPlayerProfile);

export default router;

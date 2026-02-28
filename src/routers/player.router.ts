import { Router } from 'express';
import {
  fetchPlayerProfile,
  fetchTop10Challengers,
} from '../controllers/riot.controller';

const router = Router();

router.get('/player/:routingRegion/:name/:tag', fetchPlayerProfile);
router.get('/player/challenger/:platform', fetchTop10Challengers);

export default router;

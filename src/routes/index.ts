import { Router } from 'express';
import { test, chatHandler } from '../controllers/testController';


const router = Router();

router.get('/test', test);
router.post('/chat', chatHandler);


export default router;
import { Router } from 'express';
import { test } from '../controllers/testController';


const router = Router();

router.get('/test', test);


export default router;
import { Router } from 'express';
import { test, chatHandler, docsHandler, uploadDocumentFile } from '../controllers/index';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/test', test);
router.post('/chat', chatHandler);
router.get('/docs', docsHandler);
router.post('/document/file', upload.single('file'), uploadDocumentFile);

export default router;  
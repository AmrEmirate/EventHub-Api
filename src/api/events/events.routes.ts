import { Router } from 'express';
import {
    getAllEventsController,
    getEventBySlugController,
    getEventByIdController, // Impor controller baru
    createEventController,
    updateEventController,
    deleteEventController,
    getEventAttendeesController,
    getMyOrganizerEventsController
} from './events.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// Rute Publik
router.get('/', getAllEventsController);

// Rute Terproteksi
router.get('/organizer/my-events', authMiddleware, getMyOrganizerEventsController);

// Rute baru untuk mengambil event berdasarkan ID (untuk halaman edit)
// Tempatkan sebelum rute slug agar tidak terjadi konflik
router.get('/id/:id', authMiddleware, getEventByIdController);

// Rute dinamis untuk slug (untuk halaman detail publik)
router.get('/:slug', getEventBySlugController);

router.post('/', authMiddleware, upload.single('imageUrl'), createEventController);
router.put('/:id', authMiddleware, upload.single('imageUrl'), updateEventController);
router.delete('/:id', authMiddleware, deleteEventController);
router.get('/:id/attendees', authMiddleware, getEventAttendeesController);

export default router;

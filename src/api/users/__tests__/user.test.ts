import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import userRoutes from '../user.routes';
import { errorMiddleware } from '../../../middlewares/error.middleware';
import { changeUserPassword } from '../user.service';

// Mock service layer untuk menghindari panggilan database aktual
jest.mock('../user.service');

// Mock authMiddleware untuk mensimulasikan pengguna yang sudah login
jest.mock('../../../middlewares/auth.middleware', () => ({
    authMiddleware: (req: Request, res: Response, next: NextFunction) => {
      req.user = { 
        id: 'user-test-id', 
        role: 'CUSTOMER',
        points: 0,
        name: 'Test User',
        email: 'test@example.com',
        referralCode: 'referral123',
        phone: '1234567890',
        emailVerified: new Date(),
      };
      next();
    },
  }));

const app = express();
app.use(express.json());
app.use('/api/v1/users', userRoutes);
app.use(errorMiddleware);

describe('User Endpoints', () => {
    describe('PUT /api/v1/users/me/change-password', () => {
        const mockChangeUserPassword = changeUserPassword as jest.MockedFunction<typeof changeUserPassword>;

        it('should successfully change user password', async () => {
            mockChangeUserPassword.mockResolvedValueOnce({ message: 'Password berhasil diperbarui.' });

            const res = await request(app)
                .put('/api/v1/users/me/change-password')
                .send({
                    oldPassword: 'oldpassword123',
                    newPassword: 'newpassword123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Password berhasil diperbarui.');
            expect(mockChangeUserPassword).toHaveBeenCalledWith(
                'user-test-id',
                'oldpassword123',
                'newpassword123'
            );
        });

        it('should return 400 if old password is not valid', async () => {
            mockChangeUserPassword.mockRejectedValueOnce(new Error('Password lama tidak sesuai.'));
            
            const res = await request(app)
                .put('/api/v1/users/me/change-password')
                .send({
                    oldPassword: 'wrongpassword',
                    newPassword: 'newpassword123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Password lama tidak sesuai.');
        });
        
        it('should return 400 if new password is too short', async () => {
            const res = await request(app)
                .put('/api/v1/users/me/change-password')
                .send({
                    oldPassword: 'oldpassword123',
                    newPassword: '123' // Kurang dari 6 karakter
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Input tidak valid');
            expect(res.body.errors).toHaveProperty('newPassword');
        });
    });
});
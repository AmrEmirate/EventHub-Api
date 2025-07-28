import request from 'supertest';
import express from 'express';
import authRoutes from '../auth.routes';
import * as authService from '../auth.service';
import * as passwordHelper from '../../../utils/password.helper';
import * as jwtHelper from '../../../utils/jwt.helper'; // [PENAMBAHAN] Impor untuk di-mock
import prisma from '../../../config/prisma';

// Mock semua dependensi eksternal dari controller
jest.mock('../auth.service');
jest.mock('../../../utils/password.helper');
jest.mock('../../../utils/jwt.helper'); // [PENAMBAHAN] Mock jwt.helper
jest.mock('../../../config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedPasswordHelper = passwordHelper as jest.Mocked<typeof passwordHelper>;
const mockedJwtHelper = jwtHelper as jest.Mocked<typeof jwtHelper>; // [PENAMBAHAN]
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);


describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const testEmail = `testuser_${Date.now()}@example.com`;
  const userData = {
    email: testEmail,
    name: 'Test User',
    password: 'password123',
    role: 'CUSTOMER' as 'CUSTOMER' | 'ORGANIZER',
  };

  describe('POST /api/v1/auth/register', () => {
    
    it('Harus menolak registrasi dengan data tidak valid (error Zod)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'bukan-email',
          name: 'ab',
          password: '123',
          role: 'CUSTOMER'
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('Harus berhasil mendaftarkan pengguna baru dengan data yang valid', async () => {
      mockedAuthService.registerUser.mockResolvedValue({ message: "Registrasi berhasil!" });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);
        
      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('email', testEmail);
    });

    it('Harus menolak registrasi dengan email yang sudah ada', async () => {
      mockedAuthService.registerUser.mockRejectedValue(new Error('Email sudah terdaftar.'));

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('message', 'Email sudah terdaftar.');
    });
  });

  describe('POST /api/v1/auth/login', () => {

    it('Harus menolak login dengan password yang salah', async () => {
        (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            ...userData,
            id: 'user-id-123',
            password: 'hashed_password_benar',
            emailVerified: new Date(),
        });
        mockedPasswordHelper.comparePassword.mockResolvedValue(false);
        
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: 'password-salah'
            });

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message', 'Kredensial tidak valid');
    });

    it('Harus berhasil login dengan kredensial yang benar dan mengembalikan token', async () => {
        (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            ...userData,
            id: 'user-id-123',
            password: 'hashed_password_benar',
            emailVerified: new Date(),
        });
        
        mockedPasswordHelper.comparePassword.mockResolvedValue(true);
        // [PERBAIKAN] Mock generateToken agar mengembalikan token palsu
        mockedJwtHelper.generateToken.mockReturnValue('mock-jwt-token');

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: 'password123'
            });
            
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
  });
});
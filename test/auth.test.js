process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const request = require('supertest');
const app = require('../server');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

jest.mock('../models/Admin');
jest.mock('../config/db', () => jest.fn());

describe('Auth Endpoints', () => {
    it('should create an admin if none exists', async () => {
        Admin.findOne.mockResolvedValue(null);
        Admin.create.mockResolvedValue({ username: 'admin' });
        
        const res = await request(app)
            .post('/api/auth/create-admin')
            .send({
                username: 'admin',
                password: 'password123'
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toBe('Admin created successfully');
    });

    it('should login an existing admin', async () => {
        Admin.findOne.mockResolvedValue({
            _id: 'mockid',
            username: 'admin',
            password: await bcrypt.hash('password123', 10)
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should fail with incorrect credentials', async () => {
         Admin.findOne.mockResolvedValue(null);
 
         const res = await request(app)
             .post('/api/auth/login')
             .send({
                 username: 'admin',
                 password: 'wrongpassword'
             });
 
         expect(res.statusCode).toEqual(401);
         expect(res.body.message).toBe('Invalid credentials');
    });
});

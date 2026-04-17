process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const request = require('supertest');
const app = require('../server');
const Resume = require('../models/Resume');
const jwt = require('jsonwebtoken');

jest.mock('../models/Resume');
jest.mock('../config/db', () => jest.fn());

// Mock cloudinary config
jest.mock('../config/cloudinary', () => {
    return {
        uploader: {
            upload_stream: jest.fn((options, cb) => {
                const { Writable } = require('stream');
                return new Writable({
                    write(chunk, encoding, callback) { callback(); },
                    final(callback) {
                        cb(null, { public_id: 'mock_resume_id', secure_url: 'http://mock.url/resume.pdf' });
                        callback();
                    }
                });
            }),
            destroy: jest.fn().mockResolvedValue({ result: 'ok' })
        }
    };
});

let token;

beforeAll(() => {
    token = jwt.sign({ id: 'mockadmin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('Resume Endpoints', () => {
    it('should fetch empty resume initially', async () => {
        // mock findOne().sort()
        Resume.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
        const res = await request(app).get('/api/resume');
        expect(res.statusCode).toEqual(200);
        // Wait, what does it return? res.json({ url: null, message: 'No resume uploaded yet' })
    });

    it('should allow admin to upload a resume', async () => {
        Resume.find.mockResolvedValue([]);
        Resume.create.mockResolvedValue({ url: 'http://mock.url/resume.pdf' });

        const res = await request(app)
            .post('/api/resume')
            .set('Authorization', `Bearer ${token}`)
            .field('originalName', 'My_Resume.pdf')
            .attach('resume', Buffer.from('dummy pdf content'), 'test.pdf');
            
        expect(res.statusCode).toEqual(200);
    });

    it('should successfully delete a resume', async () => {
        Resume.find.mockResolvedValue([{ _id: 'mock_id', public_id: 'mock_resume_id' }]);
        Resume.findByIdAndDelete.mockResolvedValue({});

        const res = await request(app)
            .delete('/api/resume')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toEqual(200);
    });
});

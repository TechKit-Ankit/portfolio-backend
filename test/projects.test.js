process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const request = require('supertest');
const app = require('../server');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

jest.mock('../models/Project');
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
                        cb(null, { public_id: 'mock_id', secure_url: 'http://mock.url/image.png' });
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

describe('Project Endpoints', () => {
    it('should fetch empty projects list initially', async () => {
        Project.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });
        const res = await request(app).get('/api/projects');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([]);
    });

    it('should allow admin to create a new project', async () => {
        Project.create.mockResolvedValue({
            name: 'Test Project',
            image: { url: 'http://mock.url/image.png' }
        });
        
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Test Project')
            .field('status', 'completed')
            .field('techStack', JSON.stringify(['React', 'Node']))
            .attach('image', Buffer.from('test image content'), 'test.png');
            
        expect(res.statusCode).toEqual(201);
        expect(res.body.project.name).toBe('Test Project');
    });
    
    it('should fail to create without an image', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Test Project')
            .field('status', 'completed');
            
        expect(res.statusCode).toEqual(400);
    });

    it('should fetch all projects', async () => {
        Project.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([{ name: 'P1' }])
        });
        const res = await request(app).get('/api/projects');
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('P1');
    });
});

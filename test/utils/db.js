const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

if (typeof jest !== 'undefined') {
    jest.setTimeout(300000);
}

let mongoServer;

const connect = async () => {
    // Prevent Mongoose from using an old connection
    await mongoose.disconnect();
    
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    await mongoose.connect(uri);
};

const close = async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
};

const clear = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};

module.exports = { connect, close, clear };

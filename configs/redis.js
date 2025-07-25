const redis = require('redis');

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.connect().then(() => console.log('Redis client initialized'));

module.exports = redisClient;
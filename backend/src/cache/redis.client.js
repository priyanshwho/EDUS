const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;
let connectPromise = null;

function getRedisConfig() {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL };
  }

  if (process.env.REDIS_HOST) {
    return {
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
      },
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      database: Number(process.env.REDIS_DB || 0),
    };
  }

  return null;
}

async function initRedis() {
  const config = getRedisConfig();

  if (!config) {
    console.log('[Redis] Not configured. Running without cache.');
    return null;
  }

  if (!redisClient) {
    redisClient = createClient(config);

    redisClient.on('error', (err) => {
      isConnected = false;
      console.warn(`[Redis] ${err.message}`);
    });

    redisClient.on('ready', () => {
      isConnected = true;
    });

    redisClient.on('end', () => {
      isConnected = false;
    });
  }

  if (redisClient.isOpen) {
    isConnected = true;
    return redisClient;
  }

  if (!connectPromise) {
    connectPromise = redisClient.connect()
      .then(() => {
        isConnected = true;
        console.log('[Redis] Connected');
        return redisClient;
      })
      .catch((err) => {
        isConnected = false;
        console.warn(`[Redis] Disabled: ${err.message}`);
        return null;
      })
      .finally(() => {
        connectPromise = null;
      });
  }

  return connectPromise;
}

function getRedisClient() {
  if (!redisClient || !redisClient.isOpen || !isConnected) return null;
  return redisClient;
}

function isRedisEnabled() {
  return !!getRedisClient();
}

async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  isConnected = false;
}

module.exports = {
  initRedis,
  getRedisClient,
  isRedisEnabled,
  closeRedis,
};

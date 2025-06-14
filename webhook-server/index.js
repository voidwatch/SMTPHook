const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/express')); // optional if you want Express-style middleware

// POST /incoming — receive parsed emails
fastify.post('/incoming', async (request, reply) => {
  fastify.log.info('📨 Incoming parsed email:');
  fastify.log.info(request.body);
  reply.status(200).send('Received');
});

// GET /health — simple health check
fastify.get('/health', async (_, reply) => {
  reply.send({ status: 'ok', uptime: process.uptime() });
});

// Start the server
fastify.listen({ port: process.env.PORT || 4000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`✅ Webhook receiver running at ${address}/incoming`);
});

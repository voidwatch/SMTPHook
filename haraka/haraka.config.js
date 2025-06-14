const Haraka = require('haraka');
const path = require('path');

const server = new Haraka.Server();
server.load_plugins(path.join(__dirname, 'config'));

server.listen({ port: 2525 }, () => {
  console.log('Haraka SMTP server listening on port 2525');
});

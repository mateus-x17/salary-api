import { app } from './app';
import { env } from './config/env';
import { setupWebsocket } from './websocket/socket';

async function start() {
  try {
    setupWebsocket(app.server);

    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server is running at http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

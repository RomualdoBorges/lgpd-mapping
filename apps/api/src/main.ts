import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigurationError, loadEnvironment } from './config/environment.js';

async function bootstrap(): Promise<void> {
  let app: Awaited<ReturnType<typeof NestFactory.create>> | undefined;
  try {
    const environment = loadEnvironment(process.env);
    app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    app.enableShutdownHooks();
    await app.listen(environment.port, environment.host);
    console.info('API iniciada; conexão PostgreSQL verificada.');
  } catch (error: unknown) {
    console.error(
      error instanceof ConfigurationError
        ? error.message
        : 'Falha ao iniciar API. Verifique PostgreSQL e configuração local.',
    );
    await app?.close();
    process.exitCode = 1;
  }
}
await bootstrap();

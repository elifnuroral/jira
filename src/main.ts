import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // --- Swagger Ayarları ---
  const config = new DocumentBuilder()
    .setTitle('JIRA API') // 👈 Buraya projenizin adını yazın
    .setDescription('API dokümantasyonu') // 👈 Buraya projenizin açıklamasını yazın
    .setVersion('1.0')
    .addBearerAuth() // JWT kimlik doğrulamasını ekler
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // --- Swagger Ayarları Son ---

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

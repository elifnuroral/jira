import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS (Swagger başka origin ise ve Authorization header'ı için)
  app.enableCors({
    origin: [/localhost:\d+$/],
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ------ Swagger ------
  const config = new DocumentBuilder()
    .setTitle('JIRA API')
    .setDescription('API dokümantasyonu')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token', // ⬅ şema adı
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true }, // ⬅ token kaybolmasın
  });
  // ------ Swagger Son ------

  // Hızlı debug: Authorization header geliyor mu?
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log('AUTH HEADER:', req.headers['authorization']);
    next();
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

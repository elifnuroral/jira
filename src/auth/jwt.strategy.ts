import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: number;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'your-secret-key', // .env dosyasına alınabilir
    });
  }

  validate(payload: JwtPayload) {
    // JWT token çözüldüğünde içindeki bilgiler buraya gelir
    return { userId: payload.sub, name: payload.name };
  }
}

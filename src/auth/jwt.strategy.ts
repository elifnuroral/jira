import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from 'src/user/enums/role.enum';

interface JwtPayload {
  sub: number;
  name: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        'faa7ccf01307cc266522d4ed7403b159af7bd564d93eb2a6293693129d0e05ba', // .env dosyasına alınabilir
    });
  }

  validate(payload: JwtPayload) {
    // JWT token çözüldüğünde içindeki bilgiler buraya gelir
    return { userId: payload.sub, name: payload.name, role: payload.role };
  }
}

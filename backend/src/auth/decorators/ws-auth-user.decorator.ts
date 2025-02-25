import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { User } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

export const WsAuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const client: AuthenticatedSocket = ctx.switchToWs().getClient();
    return client.user;
  },
); 
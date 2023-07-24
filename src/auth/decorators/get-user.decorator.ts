import { ExecutionContext, InternalServerErrorException, createParamDecorator } from '@nestjs/common';

export const GetUser = createParamDecorator(

  (data, context: ExecutionContext) => {

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new InternalServerErrorException('User not found (request)');

    return (!data) ? user : user[data];
  }
)
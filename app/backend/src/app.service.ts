import { Injectable } from '@nestjs/common';
// import ErrorStackParser from 'error-stack-parser';

@Injectable()
export class AppService {
  getHello(): any {
    // console.log(ErrorStackParser.parse(error as any));
    return 123;
  }
}

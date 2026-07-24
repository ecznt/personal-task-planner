import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { VersionResponseDto } from './version.dto';

@ApiTags('system')
@Controller('version')
export class VersionController {
  @ApiOperation({
    operationId: 'getVersion',
    summary: 'Return the running contract version',
  })
  @ApiOkResponse({
    type: VersionResponseDto,
  })
  @Get()
  getVersion(): VersionResponseDto {
    return {
      version: '0.0.0',
    };
  }
}

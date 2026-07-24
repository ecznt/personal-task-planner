import { ApiProperty } from '@nestjs/swagger';

export class VersionResponseDto {
  @ApiProperty({
    example: '0.0.0',
    type: String,
  })
  version!: string;
}

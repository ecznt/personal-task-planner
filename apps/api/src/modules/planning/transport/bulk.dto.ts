import { ApiProperty } from '@nestjs/swagger';

export class BulkActionItemResultDto {
  @ApiProperty({ format: 'uuid', description: 'Task ID from the request' })
  readonly taskId!: string;

  @ApiProperty({ enum: ['SUCCEEDED', 'FAILED'], description: 'Result status' })
  readonly status!: 'SUCCEEDED' | 'FAILED';

  @ApiProperty({ type: Number, required: false, description: 'New version (when succeeded)' })
  readonly version?: number;

  @ApiProperty({ type: String, required: false, description: 'New ETag (when succeeded)' })
  readonly etag?: string;

  @ApiProperty({ type: String, required: false, description: 'Error code (when failed)' })
  readonly errorCode?: string;

  @ApiProperty({ type: String, required: false, description: 'Error detail (when failed)' })
  readonly errorDetail?: string;
}

export class BulkActionsResponseDto {
  @ApiProperty({ type: [BulkActionItemResultDto], description: 'Per-item results in request order' })
  readonly results!: readonly BulkActionItemResultDto[];
}

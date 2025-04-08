import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  async check() {
    return this.health.check([
      /* istanbul ignore next */
      () => this.db.pingCheck('database', { timeout: 300 }),
      /* istanbul ignore next */
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      /* istanbul ignore next */
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      /* istanbul ignore next */
      () =>
        this.disk.checkStorage('storage', { thresholdPercent: 0.8, path: '/' }),
    ]);
  }
}

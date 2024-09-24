import { Module } from '@nestjs/common';
import { ExampleModule } from './core/example/infrastructure/example.module';

@Module({
  imports: [ExampleModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

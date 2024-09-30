import { Module } from "@nestjs/common";
import { ExampleModule } from "./core/example/infrastructure/example.module";
import { SearchModule } from "./core/search/infrastructure/search.module";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [ConfigModule.forRoot(), ExampleModule, SearchModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

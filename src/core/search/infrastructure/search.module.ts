import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "../application/search.service";
import { Client } from "@opensearch-project/opensearch";
import "dotenv/config";
import { HttpModule } from "@nestjs/axios";

@Module({
  controllers: [SearchController],
  providers: [
    SearchService,
    {
      provide: "Open_Search_Client",
      useValue: {
        instance: new Client({
          node: process.env.OPENSEARCH_SERVICE_URL,
          auth: {
            region: process.env.OPENSEARCH_REGION,
            username: process.env.OPENSEARCH_USERNAME,
            password: process.env.OPENSEARCH_PASSWORD,
          },
          ssl: {
            rejectUnauthorized: false,
          },
        }),
      },
    },
  ],
  imports: [HttpModule],
})
export class SearchModule {}

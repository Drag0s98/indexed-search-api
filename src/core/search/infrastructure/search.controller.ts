import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { SearchService } from "../application/search.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { QuerySearchDTO } from "../domain/dto/querySearch.dto";
import { SearchResponseDTO } from "../domain/dto/searchResponse.dto";

@Controller("search")
export class SearchController {
  constructor(private searchService: SearchService) {}
  @Post("/bulk")
  @UseInterceptors(FileInterceptor("csvFile"))
  async bulkData(
    @UploadedFile() file,
    @Query("indexName") indexName: string
  ): Promise<any> {
    return this.searchService.bulkData(file, indexName);
  }

  @Post("/create-index")
  async createIndex(@Body() body: { index: string }): Promise<any> {
    return this.searchService.createIndex(body.index);
  }

  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  )
  @Get()
  async search(
    @Query()
    params: QuerySearchDTO
  ): Promise<SearchResponseDTO> {
    return await this.searchService.searchQuery(params);
  }
}

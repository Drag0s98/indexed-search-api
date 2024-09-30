import { HttpService } from "@nestjs/axios";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { QuerySearchDTO } from "../domain/dto/querySearch.dto";
import { IPagination } from "../domain/interfaces/pagination.interface";
import { SearchResponseDTO } from "../domain/dto/searchResponse.dto";

const csv = require("csvtojson/v2");

@Injectable()
export class SearchService {
  private openSearchClient;
  logger: Logger;
  constructor(
    @Inject("Open_Search_Client") openSearchClient,
    private readonly httpService: HttpService
  ) {
    this.openSearchClient = openSearchClient.instance;
    this.logger = new Logger();
  }

  private async bulkToOpenSearch(data: [], indexName: string) {
    try {
      if (data) {
        await this.openSearchClient.helpers.bulk({
          datasource: data,
          onDocument(_) {
            return { index: { _index: indexName } };
          },
        });
        return new Promise((resolve) => {
          setTimeout(() => resolve(`Data loaded`), 2000);
        });
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private sliceData(data: [], limit: number) {
    const arr = [];
    let count = 0;
    data.forEach((_element, index) => {
      if (index === limit) {
        count += limit;
        arr.push(data.slice(0, limit));
      }
      if (index > limit && index % limit === 0) {
        count += limit;
        arr.push(data.slice(index - limit, index));
      }
      if (index === data.length - (data.length % limit)) {
        arr.push(data.slice(index, data.length));
      }
    });

    return arr;
  }

  async createIndex(index: string) {
    if ((await this.openSearchClient.indices.exists({ index })).body)
      await this.openSearchClient.indices.delete({ index });

    return await this.openSearchClient.indices.create({ index });
  }

  async bulkData(file: any, indexName: string): Promise<any> {
    try {
      let data = await csv().fromString(file.buffer.toString());

      this.logger.log("Length of data: ", data.length);

      data = this.sliceData(data, 1000);

      for (let i = 1; i <= data.length; i++) {
        const res = await this.bulkToOpenSearch(data[i], indexName);
        this.logger.log(res);
      }
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  async searchQuery(params: QuerySearchDTO) {
    const search_body = {
      query: {
        match: {
          title: params.query,
        },
      },
      sort: [
        {
          ["isBestSeller.keyword"]: {
            order: "asc",
          },
          ["boughtInLastMonth.keyword"]: {
            order: "desc",
          },
          ["reviews.keyword"]: {
            order: "desc",
          },
          ["stars.keyword"]: {
            order: "desc",
          },
        },
      ],
    };

    const res = await this.openSearchClient.search({
      index: "amazon-store*",
      size: params.to,
      from: params.from,
      body: search_body,
    });

    const pagination: IPagination = {
      total: res.body.hits.total,
      to: params.to,
      from: params.from,
    };
    const data: Array<{}> = res.body.hits.hits.map(
      (element) => element._source
    );

    const payload: SearchResponseDTO = {
      data,
      pagination,
    };

    return payload;
  }
}

import { HttpService } from "@nestjs/axios";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { QuerySearchDTO } from "../domain/dto/querySearch.dto";
import { IPagination } from "../domain/interfaces/pagination.interface";
import { SearchResponseDTO } from "../domain/dto/searchResponse.dto";

const csv = require("csvtojson/v2");

@Injectable()
export class SearchService {
  private readonly openSearchClient;
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
    };

    const res = await this.openSearchClient.search({
      index: params.index,
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

  async suggestionQuery(prefix: string, index_name: string) {
    const search_body = {
      _source: false,
      fields: ["text", "asin"],
      suggest: {
        autocomplete: {
          prefix: prefix,
          completion: {
            field: "title",
            size: 5,
          },
        },
      },
    };

    const { body } = await this.openSearchClient.search({
      index: index_name,
      body: search_body,
    });

    const options = body.suggest.autocomplete[0].options;

    const payload = options.map((element) => {
      return {
        prefix: element.text
          .split(" ")
          .slice(0, 4)
          .toString()
          .replaceAll(",", " "),
        id: element.fields.asin[0],
      };
    });

    return payload;
  }
}

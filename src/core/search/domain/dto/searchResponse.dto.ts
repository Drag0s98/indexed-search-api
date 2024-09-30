import { IsArray, IsObject } from "class-validator";
import { IPagination } from "../interfaces/pagination.interface";

export class SearchResponseDTO {
  @IsObject()
  pagination: IPagination;

  @IsArray()
  data: Array<{}>;
}

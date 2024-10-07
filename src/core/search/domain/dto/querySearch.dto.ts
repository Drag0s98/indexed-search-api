import { Type } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class QuerySearchDTO {
  @IsString()
  query: string;

  @IsInt()
  @Type(() => Number)
  to: number;

  @IsInt()
  @Type(() => Number)
  from: number;

  @IsString()
  index: string;
}

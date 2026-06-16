declare module "ali-oss" {
  import type { Readable } from "node:stream";

  export interface PutObjectResult {
    name: string;
    url: string;
    res: {
      status: number;
      headers: Record<string, string>;
      size: number;
      rt: number;
    };
  }

  export interface GetObjectResult {
    content: Buffer | string;
    res: {
      status: number;
      headers: Record<string, string>;
    };
  }

  export interface OSSOptions {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    endpoint?: string;
    secure?: boolean;
    authorizationV4?: boolean;
  }

  export interface PutObjectOptions {
    mime?: string;
    headers?: Record<string, string>;
  }

  export default class OSS {
    constructor(options: OSSOptions);
    put(
      name: string,
      file: Buffer | Readable | string,
      options?: PutObjectOptions,
    ): Promise<PutObjectResult>;
    get(name: string): Promise<GetObjectResult>;
  }
}

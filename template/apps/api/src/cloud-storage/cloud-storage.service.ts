import { Injectable } from '@nestjs/common';
import {
  CompleteMultipartUploadCommandOutput,
  CopyObjectCommand,
  CopyObjectCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  GetObjectOutput,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import _ from 'lodash';
import { readFile } from 'node:fs/promises';

import { ConfigService } from '../config/config.service';

type NonNullableObject = Record<string, unknown>;

function toCamelCase<T extends NonNullableObject | null | undefined>(object: T): T {
  if (object === null || object === undefined) return object;

  const transformObject = (input: NonNullableObject): NonNullableObject =>
    _.transform(input, (result: NonNullableObject, value, key) => {
      const camelKey = _.camelCase(key);

      if (_.isObject(value) && !_.isArray(value)) {
        result[camelKey] = transformObject(value as NonNullableObject);
      } else if (_.isArray(value)) {
        result[camelKey] = value.map((item) => (_.isObject(item) ? transformObject(item as NonNullableObject) : item));
      } else {
        result[camelKey] = value;
      }
    });

  return _.isObject(object) && !_.isArray(object) ? (transformObject(object as NonNullableObject) as T) : object;
}

export interface BackendFile {
  filepath: string;
  mimetype?: string | null;
  originalFilename?: string | null;
  newFilename: string;
  size: number;
}

type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : S extends `${infer P1}${infer P2}`
    ? `${Lowercase<P1>}${CamelCase<P2>}`
    : Lowercase<S>;

type ToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends object ? ToCamelCase<T[K]> : T[K];
};

type UploadOutput = ToCamelCase<CompleteMultipartUploadCommandOutput>;
type CopyOutput = ToCamelCase<CopyObjectCommandOutput>;
type DeleteOutput = ToCamelCase<DeleteObjectCommandOutput>;

@Injectable()
export class CloudStorageService {
  private readonly client: S3Client;
  private readonly bucket: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get('CLOUD_STORAGE_BUCKET');

    this.client = new S3Client({
      forcePathStyle: false,
      region: 'us-east-1',
      endpoint: this.config.get('CLOUD_STORAGE_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.get('CLOUD_STORAGE_ACCESS_KEY_ID') as string,
        secretAccessKey: this.config.get('CLOUD_STORAGE_SECRET_ACCESS_KEY') as string,
      },
    });
  }

  async upload(fileName: string, file: BackendFile): Promise<UploadOutput> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      ContentType: file.mimetype as string,
      Body: await readFile(file.filepath),
      Key: fileName,
      ACL: 'private',
    };

    const multipartUpload = new Upload({ client: this.client, params });
    return multipartUpload.done().then((value) => toCamelCase<UploadOutput>(value as unknown as UploadOutput));
  }

  async uploadPublic(fileName: string, file: BackendFile): Promise<UploadOutput> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      ContentType: file.mimetype as string,
      Body: await readFile(file.filepath),
      Key: fileName,
      ACL: 'public-read',
    };

    const multipartUpload = new Upload({ client: this.client, params });
    return multipartUpload.done().then((value) => toCamelCase<UploadOutput>(value as unknown as UploadOutput));
  }

  getSignedDownloadUrl(fileName: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: fileName });
    return getSignedUrl(this.client, command, { expiresIn: 1800 });
  }

  getObject(fileName: string): Promise<GetObjectOutput> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: fileName });
    return this.client.send(command);
  }

  async copyObject(filePath: string, copyFilePath: string): Promise<CopyOutput> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: encodeURI(`${this.bucket}/${copyFilePath}`),
      Key: filePath,
    });

    return this.client.send(command).then((value) => toCamelCase<CopyOutput>(value as unknown as CopyOutput));
  }

  async deleteObject(fileName: string): Promise<DeleteOutput> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: fileName });
    return this.client.send(command).then((value) => toCamelCase<DeleteOutput>(value as unknown as DeleteOutput));
  }

  getFileKey(url: string | null | undefined): string {
    if (!url) return '';

    const decodedUrl = decodeURI(url);
    const { pathname } = new URL(decodedUrl);
    return pathname.substring(1);
  }
}

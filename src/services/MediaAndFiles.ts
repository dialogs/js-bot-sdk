/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import fetch from 'node-fetch';
import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';
import { TryCatchWrapper } from '../entities/utils';

class MediaAndFiles extends Service<any> {
  constructor(config: Config) {
    super(dialog.MediaAndFiles, config);
  }

  @TryCatchWrapper
  public getFileUrls(
    request: dialog.RequestGetFileUrls,
    metadata?: Metadata,
  ): Promise<dialog.ResponseGetFileUrls> {
    return this.service.getFileUrlsAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  @TryCatchWrapper
  public getFileUploadUrl(
    request: dialog.RequestGetFileUploadUrl,
    metadata?: Metadata,
  ): Promise<dialog.ResponseGetFileUploadUrl> {
    return this.service.getFileUploadUrlAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  @TryCatchWrapper
  public getFileUploadPartUrl(
    request: dialog.RequestGetFileUploadPartUrl,
    metadata?: Metadata,
  ): Promise<dialog.ResponseGetFileUploadPartUrl> {
    return this.service.getFileUploadPartUrlAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  @TryCatchWrapper
  public commitFileUpload(
    request: dialog.RequestCommitFileUpload,
    metadata?: Metadata,
  ): Promise<dialog.ResponseCommitFileUpload> {
    return this.service.commitFileUploadAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  @TryCatchWrapper
  public async uploadChunk(url: string, content: Buffer): Promise<void> {
    const res = await fetch(url, {
      body: content,
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }
  }
}

export default MediaAndFiles;

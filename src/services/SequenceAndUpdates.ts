/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata, ClientReadableStream } from 'grpc';
import { dialog, google } from '@dlghq/dialog-api';
import { Observable, Subscriber, from } from 'rxjs';
import Service, { Config } from './Service';
import { map, flatMap } from 'rxjs/operators';
import { TryCatchWrapper } from '../entities/utils';

class SequenceAndUpdates extends Service<any> {
  private readonly config: Config;

  constructor(config: Config) {
    super(dialog.SequenceAndUpdates, config);
    this.config = config;
  }

  @TryCatchWrapper
  public getState(
    request: dialog.RequestGetState,
    metadata?: Metadata,
  ): Promise<dialog.ResponseSeq> {
    return this.service.getStateAsync(request, metadata, this.getCallOptions());
  }

  @TryCatchWrapper
  public getDifference(
    request: dialog.RequestGetDifference,
    metadata?: Metadata,
  ): Promise<dialog.ResponseGetDifference> {
    return this.service.getDifferenceAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  @TryCatchWrapper
  public getReferencedEntities(
    request: dialog.RequestGetReferencedEntitites,
    metadata?: Metadata,
  ): Promise<dialog.ResponseGetReferencedEntitites> {
    return this.service.getReferencedEntititesAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  public seqUpdates(
    request: google.protobuf.Empty,
  ): Observable<dialog.SeqUpdateBox> {
    return from(this.config.generateMetadata(this.config.endpoint)).pipe(
      flatMap(
        (metadata) =>
          new Observable((emitter: Subscriber<dialog.SeqUpdateBox>) => {
            const call: ClientReadableStream<
              dialog.SeqUpdateBox
            > = this.service.seqUpdates(request, metadata);

            call.on('data', (update: dialog.SeqUpdateBox) =>
              emitter.next(update),
            );
            call.on('end', () => emitter.complete());
            call.on('error', (error) => emitter.error(error));

            return () => {
              call.cancel();
            };
          }),
      ),
    );
  }
}

export default SequenceAndUpdates;

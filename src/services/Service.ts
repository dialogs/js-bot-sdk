/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Logger } from 'pino';
import Bluebird from 'bluebird';
import {
  propagate,
  credentials,
  Metadata,
  CallOptions,
  CallCredentials,
  ChannelCredentials,
  Client,
} from 'grpc';
import createLogInterceptor from './interceptors/logger';
import RetryOptions from '../entities/RetryOptions';

const DEFAULT_DEADLINE = 5 * 1000;

export type MetadataGenerator = (serviceUrl: string) => Promise<Metadata>;

export type Config = {
  logger: Logger;
  endpoint: string;
  credentials: ChannelCredentials;
  generateMetadata: MetadataGenerator;
  retryOptions?: RetryOptions;
  callOptions?: CallOptionsConfig;
};

export type CallOptionsConfig = {
  deadline?: number;
  authRequired?: boolean;
};

abstract class Service<T extends Client> {
  protected readonly service: T;
  private readonly credentials: CallCredentials;
  private readonly noopCredentials: CallCredentials;
  private readonly retryOptions: RetryOptions | undefined;
  private readonly deadline: number;
  private authRequired: boolean;

  protected constructor(ServiceImpl: T, config: Config) {
    this.service = Bluebird.promisifyAll(
      // @ts-ignore
      new ServiceImpl(config.endpoint, config.credentials, {
        interceptors: [createLogInterceptor(config.logger)],
      }),
    );

    this.credentials = credentials.createFromMetadataGenerator(
      (params, callback) => {
        config
          .generateMetadata(params.service_url)
          .then((metadata) => callback(null, metadata))
          .catch((error) => callback(error));
      },
    );

    this.noopCredentials = credentials.createFromMetadataGenerator(
      (params, callback) => {
        callback(null, new Metadata());
      },
    );

    this.retryOptions = config.retryOptions;
    this.deadline =
      config.callOptions && config.callOptions.deadline
        ? config.callOptions.deadline
        : DEFAULT_DEADLINE;
    this.authRequired =
      config.callOptions && config.callOptions.authRequired
        ? config.callOptions.authRequired
        : true;
  }

  protected getCallOptions({
    deadline = this.deadline,
    authRequired = this.authRequired,
  }: CallOptionsConfig = {}): CallOptions {
    console.log(Date.now());
    console.log(deadline);
    console.log(Date.now() + deadline);
    return {
      deadline: Date.now() + deadline,
      credentials: authRequired ? this.credentials : this.noopCredentials,
      propagate_flags: propagate.DEFAULTS,
    };
  }

  public close() {
    this.service.close();
  }
}

export default Service;

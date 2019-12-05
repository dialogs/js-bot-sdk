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

const DEFAULT_DEADLINE = 30 * 1000;

export type MetadataGenerator = (serviceUrl: string) => Promise<Metadata>;

export type Config = {
  logger: Logger;
  endpoint: string;
  credentials: ChannelCredentials;
  generateMetadata: MetadataGenerator;
  retryOptions?: Map<string, number>;
};

type CallOptionsConfig = {
  deadline?: number;
  authRequired?: boolean;
};

abstract class Service<T extends Client> {
  protected readonly service: T;
  private readonly credentials: CallCredentials;
  private readonly noopCredentials: CallCredentials;
  private readonly defaultOptions: Map<string, number>;
  private readonly retryOptions: Map<string, number> | null;

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

    this.defaultOptions = new Map<string, number>();
    this.defaultOptions.set('minDelay', 1);
    this.defaultOptions.set('maxDelay', 50);
    this.defaultOptions.set('delayFactor', Math.exp(1));
    this.defaultOptions.set('maxRetries', 5);

    this.retryOptions = this.getRetryOptions(config.retryOptions);
  }

  protected getCallOptions({
    deadline = DEFAULT_DEADLINE,
    authRequired = true,
  }: CallOptionsConfig = {}): CallOptions {
    return {
      deadline: Date.now() + deadline,
      credentials: authRequired ? this.credentials : this.noopCredentials,
      propagate_flags: propagate.DEFAULTS,
    };
  }

  private getRetryOptions(
    options: Map<string, number> | undefined,
  ): Map<string, number> | null {
    if (options === undefined) return null;

    this.defaultOptions.forEach((value, key) => {
      if (options.get(key) === undefined) options.set(key, value);
    });
    return options;
  }

  public close() {
    this.service.close();
  }
}

export default Service;

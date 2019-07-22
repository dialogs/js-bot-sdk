/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Message } from 'protobufjs';
import {
  Client,
  Server,
  ServerCredentials,
  MethodDefinition,
  sendUnaryData,
  ServerUnaryCall,
  ServerDuplexStream,
  ServerReadableStream,
  ServerWriteableStream,
} from 'grpc';
import createCredentials from '../../utils/createCredentials';
import { dialog } from '@dlghq/dialog-api';
import forEach from 'lodash/forEach';

type Config = {
  listen: string;
  listenCredentials: ServerCredentials;
  target: string;
};

function createProxy(config: Config) {
  const url = new URL(config.target);
  const credentials = createCredentials(url);
  const client = new Client(url.host, credentials);
  const server = new Server();

  forEach(dialog, ({ service }: any) => {
    if (!service) {
      return;
    }

    forEach(service, (method: MethodDefinition<Message, Message>) => {
      if (method.requestStream) {
        if (method.responseStream) {
          server.register(
            method.path,
            (incoming: ServerDuplexStream<Message, Message>) => {
              const outgoing = client.makeBidiStreamRequest(
                method.path,
                method.requestSerialize,
                method.responseDeserialize,
                incoming.metadata,
                null,
              );

              // @ts-ignore
              incoming.pipe(outgoing);
              outgoing.pipe(incoming);

              incoming.on('cancel', () => outgoing.cancel());
            },
            method.responseSerialize,
            method.requestDeserialize,
            'bidi',
          );
        } else {
          server.register(
            method.path,
            (
              incoming: ServerReadableStream<Message>,
              callback: sendUnaryData<Message>,
            ) => {
              const outgoing = client.makeClientStreamRequest(
                method.path,
                method.requestSerialize,
                method.responseDeserialize,
                incoming.metadata,
                null,
                (error, value) => callback(error || null, value || null),
              );

              // @ts-ignore
              incoming.pipe(outgoing);

              incoming.on('cancel', () => outgoing.cancel());
            },
            method.responseSerialize,
            method.requestDeserialize,
            'client_stream',
          );
        }
      } else {
        if (method.responseStream) {
          server.register(
            method.path,
            (incoming: ServerWriteableStream<Message>) => {
              const outgoing = client.makeServerStreamRequest(
                method.path,
                method.requestSerialize,
                method.responseDeserialize,
                incoming.request,
                incoming.metadata,
                null,
              );

              outgoing.pipe(incoming);

              incoming.on('cancel', () => outgoing.cancel());
            },
            method.responseSerialize,
            method.requestDeserialize,
            'server_stream',
          );
        } else {
          server.register(
            method.path,
            (
              incoming: ServerUnaryCall<Message>,
              callback: sendUnaryData<Message>,
            ) => {
              const outgoing = client.makeUnaryRequest(
                method.path,
                method.requestSerialize,
                method.responseDeserialize,
                incoming.request,
                incoming.metadata,
                null,
                (error, value) => {
                  callback(error || null, value || null);
                },
              );

              // @ts-ignore
              incoming.on('cancel', () => outgoing.cancel());
            },
            method.responseSerialize,
            method.requestDeserialize,
            'unary',
          );
        }
      }
    });
  });

  server.bind(config.listen, config.listenCredentials);

  return {
    start: async () => server.start(),
    stop: async () => server.forceShutdown(),
  };
}

export default createProxy;

/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import fs from 'fs';
import path from 'path';
import { ServerCredentials } from 'grpc';
import Bot, { Peer } from '../index';
import createProxy from './test-utils/grpc-proxy';
import parseTestEnv from './test-utils/parseTestEnv';
import ensureBotsKnowsEachOther from './test-utils/ensureBotsKnowsEachOther';
import {
  testWithContext,
  beforeAllWithContext,
  afterAllWithContext,
} from './test-utils/test-utils';

const context = beforeAllWithContext(async () => {
  jest.setTimeout(30000);

  const env = parseTestEnv();

  const certsDir = path.resolve(__dirname, 'test-utils/certs');
  const privateKey = fs.readFileSync(
    path.resolve(certsDir, 'self-signed-test-only.key'),
  );
  const certChain = fs.readFileSync(
    path.resolve(certsDir, 'self-signed-test-only.crt'),
  );

  const proxy = createProxy({
    listen: 'localhost:3000',
    listenCredentials: ServerCredentials.createSsl(null, [
      { private_key: privateKey, cert_chain: certChain },
    ]),
    target: env.endpoint,
  });
  await proxy.start();

  const bob = new Bot({
    token: env.firstBotToken,
    endpoints: [env.endpoint],
    loggerOptions: {
      name: 'bob',
      level: 'debug',
      prettyPrint: true,
    },
  });

  const alice = new Bot({
    ssl: { rootCerts: certChain },
    token: env.secondBotToken,
    endpoints: ['https://localhost:3000'],
    loggerOptions: {
      name: 'alice',
      level: 'debug',
      prettyPrint: true,
    },
  });

  await ensureBotsKnowsEachOther(bob, alice);

  return { bob, alice, proxy };
});

afterAllWithContext(context, async ({ bob, alice, proxy }) => {
  bob.stop();
  alice.stop();
  await proxy.stop();
});

testWithContext('network', context, async ({ bob, alice, proxy }) => {
  const onNext = jest.fn();
  const onError = jest.fn();

  alice.subscribeToMessages().subscribe({
    next: onNext,
    error: onError,
  });

  bob.logger.info('send online message');
  const { id: aliceId } = await alice.getSelf();
  await bob.sendText(Peer.private(aliceId), 'online');

  await proxy.stop();

  bob.logger.info('send offline message');
  await bob.sendText(Peer.private(aliceId), 'offline');
  await proxy.start();

  debugger;

  expect(onNext).toBeCalledTimes(2);

  console.log({ onNext: onNext.mock, onError: onError.mock });
});

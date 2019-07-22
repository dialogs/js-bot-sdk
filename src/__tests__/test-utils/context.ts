/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import Bot, { Peer } from '../../index';
import parseTestEnv from './parseTestEnv';
import { beforeAllWithContext, afterAllWithContext } from './test-utils';

const context = beforeAllWithContext(async () => {
  const env = parseTestEnv();

  const endpoints = [env.endpoint];
  const bot1 = new Bot({ endpoints, token: env.firstBotToken });
  const bot2 = new Bot({ endpoints, token: env.secondBotToken });

  const bot2Self = await bot2.getSelf();
  if (!bot2Self.nick) {
    throw new Error('bot2 must have nickname');
  }

  const bot2Peer = await bot1.findUserByNick(bot2Self.nick).then((user) => {
    if (user) {
      return Peer.private(user.id);
    }

    throw new Error('bot1 not able to find bot2');
  });

  return { bot1, bot2, bot2Peer };
});

afterAllWithContext(context, async ({ bot1, bot2 }) => {
  bot1.stop();
  bot2.stop();
});

export default context;

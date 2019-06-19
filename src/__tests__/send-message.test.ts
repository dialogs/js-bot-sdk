/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import dotenv from 'dotenv';
import { combineLatest } from 'rxjs';
import { tap, filter, take } from 'rxjs/operators';
import Bot, { Peer } from '../index';
import { beforeAllWithContext, afterAllWithContext, testWithContext } from './test-utils';

const context = beforeAllWithContext(async () => {
  dotenv.config();

  const env = (name: string): string => {
    const value = process.env[name];
    if (value) {
      return value;
    }

    throw new Error(`${name} env variable not defined`);
  };

  const endpoints = [env('BOT_ENDPOINT')];
  const bot1 = new Bot({ endpoints, token: env('BOT_TOKEN_FIRST') });
  const bot2 = new Bot({ endpoints, token: env('BOT_TOKEN_SECOND') });

  const bot2Self = await bot2.getSelf();
  if (!bot2Self.nick) {
    throw new Error('bot2 must have nickname');
  }

  const bot2Peer = await bot1
    .findUserByNick(bot2Self.nick)
    .then((user) => {
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

testWithContext('bot2 should receive message from bot1', context, async ({ bot1, bot2, bot2Peer }) => {
  const text = 'hello, world!';
  const now = Date.now();

  await combineLatest(
    bot2.subscribeToMessages(),
    bot1.sendText(bot2Peer, text)
  )
    .pipe(
      filter(([message, mid]) => message.id.toString() === mid.toString()),
      take(1),
      tap(([message]) => {
        if (message.content.type === 'text') {
          expect(message.content.text).toBe(text);
        }

        expect(Math.abs(message.date.getTime() - now)).toBeLessThanOrEqual(5000);
      })
    )
    .toPromise();
});

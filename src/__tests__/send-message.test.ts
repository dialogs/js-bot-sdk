/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { combineLatest } from 'rxjs';
import { tap, filter, take } from 'rxjs/operators';
import { testWithContext } from './test-utils/test-utils';
import context from './test-utils/context';

testWithContext(
  'bot2 should receive message from bot1',
  context,
  async ({ bot1, bot2, bot2Peer }) => {
    const text = 'hello, world!';
    const now = Date.now();

    await combineLatest(
      bot2.subscribeToMessages(),
      bot1.sendText(bot2Peer, text),
    )
      .pipe(
        filter(([message, mid]) => message.id.toString() === mid.toString()),
        take(1),
        tap(([message]) => {
          if (message.content.type === 'text') {
            expect(message.content.text).toBe(text);
          }

          expect(Math.abs(message.date.getTime() - now)).toBeLessThanOrEqual(
            5000,
          );
        }),
      )
      .toPromise();
  },
);

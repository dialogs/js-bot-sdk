/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { EMPTY, of, combineLatest } from 'rxjs';
import { tap, flatMap, first, bufferCount } from 'rxjs/operators';
import { testWithContext } from './test-utils';
import context from './context';
import { Message, TextContent, UpdateEditMessage } from '../entities';

testWithContext(
  'bot2 should be able to edit messages from bot1',
  context,
  async ({ bot1, bot2, bot2Peer }) => {
    const text = `test message ${new Date()}`;
    const updateText = `updated test message ${new Date()}`;

    await combineLatest(
      bot2.subscribeToMessageUpdates(),
      (async () => {
        const initial = await bot1.sendText(bot2Peer, text);
        await bot1.editText(initial.id, initial.editedAt, updateText);
        return initial.id;
      })(),
    )
      .pipe(
        flatMap(([update, id]) =>
          id.equals(update.payload.id) ? of(update) : EMPTY,
        ),
        bufferCount(2),
        first(),
        tap(([updateNew, updateEdit]) => {
          if (updateNew.type === 'edit') {
            const update = updateNew;
            updateNew = updateEdit;
            updateEdit = update;
          }
          expect(updateNew).toBeTruthy();
          expect(updateNew.type).toBe('new');
          const message = updateNew.payload as Message;
          expect(updateNew.payload.content.type).toBe('text');
          expect((updateNew.payload.content as TextContent).text).toBe(text);

          expect(updateEdit).toBeTruthy();
          expect(updateEdit.type).toBe('edit');
          const edit = updateEdit.payload as UpdateEditMessage;
          expect(edit.content.type).toBe('text');
          expect((edit.content as TextContent).text).toBe(updateText);

          expect(message.id).toStrictEqual(edit.id);
        }),
      )
      .toPromise();
  },
);

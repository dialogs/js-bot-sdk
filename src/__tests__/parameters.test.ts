/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { from } from 'rxjs';
import { tap, flatMap } from 'rxjs/operators';
import { testWithContext } from './test-utils/test-utils';
import context from './test-utils/context';

testWithContext(
  'bot should be able manage parameters',
  context,
  async ({ bot1 }) => {
    from(bot1.setParameter('__test__', '__value__')).pipe(
      flatMap(() => bot1.getParameter('__test__')),
      tap((value) => expect(value).toBe('__value__')),
    );
  },
);

/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import Bot from '../../index';

async function ensureBotsKnowsEachOther(...bots: Array<Bot>) {
  for (const bot of bots) {
    const filtered = bots.filter((item) => item !== bot);
    for (const target of filtered) {
      const self = await target.getSelf();
      if (!self.nick) {
        throw new Error(`bot #${self.id} must have nickname`);
      }

      const found = bot.findUserByNick(self.nick);
      if (!found) {
        throw new Error(
          `bot #${(await bot.getSelf()).id} not able to find ${self.nick}`,
        );
      }
    }
  }
}

export default ensureBotsKnowsEachOther;

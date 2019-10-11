/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import path from 'path';
import dotenv from 'dotenv';
import Bot, {
  MessageAttachment,
  ActionGroup,
  Action,
  Button,
  GroupType,
} from '../src';
import { flatMap } from 'rxjs/operators';
import { combineLatest, merge } from 'rxjs';

dotenv.config();

async function run(token: string, endpoint: string) {
  const bot = new Bot({
    token,
    endpoints: [endpoint],
    loggerOptions: {
      name: 'example-bot',
      level: 'trace',
      prettyPrint: true,
    },
  });

  const self = await bot.getSelf();
  bot.logger.info(`I've started, post me something @${self.nick}`);

  bot.updateSubject.subscribe({
    next(update) {
      bot.logger.info(JSON.stringify({ update }, null, 2));
    },
  });

  const messagesHandle = bot.subscribeToMessages().pipe(
    flatMap(async (message) => {
      const author = await bot.forceGetUser(message.senderUserId);
      if (author.isBot) {
        // ignore other bots
        return;
      }

      if (message.content.type === 'text') {
        switch (message.content.text) {
          case 'octocat':
            await bot.sendImage(
              message.peer,
              path.join(__dirname, 'Sentrytocat.jpg'),
              MessageAttachment.forward(message.id),
            );
            break;

          case 'document':
            // reply to self sent message with document
            await bot.sendDocument(
              message.peer,
              __filename,
              MessageAttachment.reply(message.id),
            );
            break;

          case 'group':
            const group = await bot.createGroup(
              'Test Group',
              GroupType.privateGroup(),
            );
            await bot.inviteGroupMember(
              group,
              await bot.forceGetUser(message.senderUserId),
            );
            const securityBot = await bot.findUserByNick('security');
            if (securityBot) {
              await bot.inviteGroupMember(group, securityBot);
              await bot.sendText(
                group.getPeer(),
                `@security I've invited you and I will kick you!`,
              );
              await bot.kickGroupMember(group, securityBot);
            }

            await bot.sendText(
              group.getPeer(),
              `Invite everyone to this group: ${await bot.fetchGroupInviteUrl(
                group,
              )}`,
            );

            break;

          case 'delete':
            if (message.attachment) {
              await Promise.all(
                message.attachment.mids.map((mid) => bot.deleteMessage(mid)),
              );
            }
            break;

          default:
            // echo message with reply
            const mid = await bot.sendText(
              message.peer,
              message.content.text,
              MessageAttachment.reply(message.id),
              ActionGroup.create({
                actions: [
                  Action.create({
                    id: 'test',
                    widget: Button.create({ label: 'Test' }),
                  }),
                ],
              }),
            );
            break;
        }
      }
    }),
  );

  const actionsHandle = bot
    .subscribeToActions()
    .pipe(
      flatMap(async (event) => bot.logger.info(JSON.stringify(event, null, 2))),
    );

  await new Promise((resolve, reject) => {
    merge(messagesHandle, actionsHandle).subscribe({
      error: reject,
      complete: resolve,
    });
  });
}

const token = process.env.BOT_TOKEN;
if (typeof token !== 'string') {
  throw new Error('BOT_TOKEN env variable not configured');
}

const endpoint =
  process.env.BOT_ENDPOINT || 'https://grpc-test.transmit.im:9443';

run(token, endpoint).catch((error) => {
  console.error(error);
  process.exit(1);
});

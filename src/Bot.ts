/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import pino, { Logger, LoggerOptions } from 'pino';
import { Observable, Subject, of, EMPTY, Subscription } from 'rxjs';
import { flatMap, tap } from 'rxjs/operators';
import { retryBackoff } from 'backoff-rxjs';
import { dialog } from '@dlghq/dialog-api';
import Rpc, { Token } from './Rpc';
import {
  UUID,
  Peer,
  User,
  Group,
  ActionEvent,
  FileLocation,
  Message,
  HistoryMessage,
  ActionGroup,
  TextContent,
  DocumentContent,
  MessageAttachment,
} from './entities';
import State from './State';
import { ResponseEntities } from './internal/types';
import getFileInfo from './utils/getFileInfo';
import createImagePreview from './utils/createImagePreview';
import normalizeArray from './utils/normalizeArray';
import DeletedContent from './entities/messaging/content/DeletedContent';
import { SSLConfig } from './utils/createCredentials';

type Config = {
  token: Token;
  endpoints: Array<string>;
  ssl?: SSLConfig;
  loggerOptions?: LoggerOptions;
};

class Bot {
  private readonly rpc: Rpc;
  private readonly ready: Promise<State>;
  private subscriptions: Array<Subscription> = [];

  public readonly logger: Logger;
  public readonly updateSubject: Subject<
    dialog.UpdateSeqUpdate
  > = new Subject();

  constructor(config: Config) {
    const endpoint = config.endpoints
      .map((url) => new URL(url))
      .find(() => true);
    if (!endpoint) {
      throw new Error('Endpoints misconfigured');
    }

    this.logger = pino(config.loggerOptions);

    this.rpc = new Rpc({
      endpoint,
      ssl: config.ssl,
      logger: this.logger,
    });

    this.ready = this.start(config.token);
  }

  public stop() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];

    this.rpc.close();
  }

  private async start(token: Token) {
    const self = User.from(await this.rpc.authorize(token));
    const state = new State(self);
    const dialogs = await this.applyEntities(
      state,
      await this.rpc.loadDialogs(),
    );
    state.applyDialogs(dialogs);

    state.applyParameters(await this.rpc.getParameters());

    const subscription = this.rpc
      .subscribeSeqUpdates()
      .pipe(
        tap({ error: (error) => this.logger.error(error) }),
        retryBackoff({ initialInterval: 100, maxInterval: 30 * 1000 }),
        flatMap(async (update) => {
          const missing = state.checkEntities(update);
          if (missing.length) {
            const dialogs = await this.applyEntities(
              state,
              await this.rpc.loadMissingPeers(missing),
            );
            state.applyDialogs(dialogs);
          }

          state.applyUpdate(update);

          return update;
        }),
      )
      .subscribe(this.updateSubject);

    this.subscriptions.push(subscription);

    return state;
  }

  private async applyEntities<T>(
    state: State,
    responseEntities: ResponseEntities<T>,
  ): Promise<T> {
    const peerEntities = state.applyResponseEntities(responseEntities);
    const entities = await this.rpc.loadPeerEntities(peerEntities);
    state.applyEntities(entities);

    return responseEntities.payload;
  }

  /**
   * Returns self (bot) user entity.
   */
  public async getSelf(): Promise<User> {
    const state = await this.ready;
    return state.self;
  }

  /**
   * Returns user by id, if bot already seen this user before.
   */
  public async getUser(uid: number): Promise<null | User> {
    const state = await this.ready;
    return state.users.get(uid) || null;
  }

  /**
   * Returns group by id, if bot already seen this group before.
   */
  public async getGroup(gid: number): Promise<null | Group> {
    const state = await this.ready;
    return state.groups.get(gid) || null;
  }

  /**
   * Subscribes to messages stream.
   */
  public subscribeToMessages(): Observable<Message> {
    return this.updateSubject.pipe(
      flatMap((update) => {
        if (update.updateMessage) {
          return of(Message.from(update.updateMessage));
        }

        return EMPTY;
      }),
    );
  }

  /**
   * Subscribes to messages stream.
   */
  public subscribeToActions(): Observable<ActionEvent> {
    return this.updateSubject.pipe(
      flatMap((update) => {
        if (update.updateInteractiveMediaEvent) {
          return of(ActionEvent.from(update.updateInteractiveMediaEvent));
        }

        return EMPTY;
      }),
    );
  }

  /**
   * Sends text message.
   */
  public async sendText(
    peer: Peer,
    text: string,
    attachment?: null | MessageAttachment,
    actionOrActions?: ActionGroup | ActionGroup[],
  ): Promise<UUID> {
    const state = await this.ready;
    const outPeer = state.createOutPeer(peer);
    const content = TextContent.create(text, normalizeArray(actionOrActions));

    return this.rpc.sendMessage(outPeer, content, attachment);
  }

  /**
   * Edits text message.
   */
  public async editText(
    mid: UUID,
    text: string,
    actionOrActions?: ActionGroup | ActionGroup[],
  ): Promise<void> {
    const content = TextContent.create(text, normalizeArray(actionOrActions));

    return this.rpc.editMessage(mid, content);
  }

  /**
   * Edits text message.
   */
  public async deleteMessage(mid: UUID): Promise<void> {
    return this.rpc.editMessage(mid, DeletedContent.create());
  }

  /**
   * Sends document message.
   */
  public async sendDocument(
    peer: Peer,
    fileName: string,
    attachment?: MessageAttachment,
  ): Promise<UUID> {
    const state = await this.ready;
    const outPeer = state.createOutPeer(peer);
    const fileInfo = await getFileInfo(fileName);
    const fileLocation = await this.rpc.uploadFile(fileName, fileInfo);

    const content = DocumentContent.create(
      fileInfo.name,
      fileInfo.size,
      fileInfo.mime,
      null,
      FileLocation.from(fileLocation),
      null,
    );

    return this.rpc.sendMessage(outPeer, content, attachment);
  }

  /**
   * Sends image message.
   */
  public async sendImage(
    peer: Peer,
    fileName: string,
    attachment?: MessageAttachment,
  ): Promise<UUID> {
    const state = await this.ready;
    const outPeer = state.createOutPeer(peer);
    const fileInfo = await getFileInfo(fileName);
    const { preview, extension } = await createImagePreview(fileName);
    const fileLocation = await this.rpc.uploadFile(fileName, fileInfo);

    const content = DocumentContent.create(
      fileInfo.name,
      fileInfo.size,
      fileInfo.mime,
      preview,
      FileLocation.from(fileLocation),
      extension,
    );

    return this.rpc.sendMessage(outPeer, content, attachment);
  }

  /**
   * Retrieves file url by location.
   */
  public fetchFileUrl(fileLocation: FileLocation): Promise<string> {
    return this.rpc.fetchFileUrl(fileLocation);
  }

  /**
   * Retrieves messages by message ids.
   */
  public async fetchMessages(
    mids: Array<UUID>,
  ): Promise<Array<HistoryMessage>> {
    const messages = await this.applyEntities(
      await this.ready,
      await this.rpc.fetchMessages(mids),
    );

    return messages.map(HistoryMessage.from);
  }

  /**
   * Finds user by nick.
   */
  public async findUserByNick(nick: string): Promise<User | null> {
    const state = await this.ready;
    const uids = await this.applyEntities(
      state,
      await this.rpc.searchContacts(nick),
    );

    const lowerNick = nick.toLowerCase();
    for (let id of uids) {
      const user = state.users.get(id);
      if (user && user.nick && lowerNick === user.nick.toLowerCase()) {
        return user;
      }
    }

    return null;
  }

  public async getParameter(key: string): Promise<string | null> {
    const state = await this.ready;

    return state.parameters.get(key) || null;
  }

  public async setParameter(key: string, value: string): Promise<void> {
    const state = await this.ready;

    await this.rpc.editParameter(key, value);

    state.parameters.set(key, value);
  }

  public async createGroup(users: Array<User>, title: string): Promise<void> {
    await this.ready;
    const outOfPeerUsers = users.map((user) => {
      const { id, accessHash } = User.from(user);
      return new dialog.UserOutPeer({ uid: id, accessHash });
    });
    await this.rpc.createGroup(outOfPeerUsers, title);
  }
}

export default Bot;

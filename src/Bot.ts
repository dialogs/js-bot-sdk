/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import pino, { Logger, LoggerOptions } from 'pino';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  of,
  combineLatest,
} from 'rxjs';
import { tap, flatMap, first } from 'rxjs/operators';
import { retryBackoff } from 'backoff-rxjs';
import { dialog } from '@dlghq/dialog-api';
import Rpc, { Token } from './Rpc';
import {
  UUID,
  Peer,
  User,
  Group,
  GroupMemberList,
  ActionEvent,
  FileLocation,
  Message,
  HistoryMessage,
  ActionGroup,
  TextContent,
  DocumentContent,
  MessageAttachment,
  DeletedContent,
  FullUser,
  HistoryListMode,
  GroupType,
  PeerType,
  MessagingUpdate,
  parseMessagingUpdate,
  Content,
} from './entities';
import State from './State';
import { dateFromLong, getOpt } from './entities/utils';
import { ResponseEntities } from './internal/types';
import getFileInfo from './utils/getFileInfo';
import createImagePreview from './utils/createImagePreview';
import normalizeArray from './utils/normalizeArray';
import { SSLConfig } from './utils/createCredentials';
import { PeerNotFoundError, MessageRejectedError } from './errors';
import RetryOptions from './entities/RetryOptions';

type Config = {
  token: Token;
  endpoints: Array<string>;
  ssl?: SSLConfig;
  loggerOptions?: LoggerOptions;
  retryOptions?: RetryOptions;
  callOptions?: CallOptionsConfig;
};

type CallOptionsConfig = {
  deadline?: number;
  authRequired?: boolean;
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
      retryOptions: config.retryOptions,
      callOptions: config.callOptions,
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
   * Returns null if user not found.
   */
  public async getUser(userId: number): Promise<null | User> {
    const state = await this.ready;
    return state.users.get(userId) || null;
  }

  /**
   * Returns user by id, if bot already seen this user before.
   * Throws PeerNotFoundError if user not found.
   */
  public async forceGetUser(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new PeerNotFoundError(Peer.private(userId));
    }

    return user;
  }

  /**
   * Loads full user profile, if bot already seen this user before.
   */
  public async loadFullUser(userId: number): Promise<FullUser | null> {
    const user = await this.getUser(userId);
    return user ? this.rpc.loadFullUser(user.getUserOutPeer()) : null;
  }

  /**
   * Returns group by id, if bot already seen this group before.
   * Returns null if group not found.
   */
  public async getGroup(gid: number): Promise<null | Group> {
    const state = await this.ready;
    return state.groups.get(gid) || null;
  }

  /**
   * Returns group by id, if bot already seen this group before.
   * Throws PeerNotFoundError if group not found.
   */
  public async forceGetGroup(groupId: number): Promise<Group> {
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new PeerNotFoundError(Peer.group(groupId));
    }

    return group;
  }

  /**
   * Returns existing dialogs.
   */
  public async getDialogs(): Promise<Array<Peer>> {
    const state = await this.ready;
    return state.dialogs;
  }

  /**
   * Returns existing dialogs.
   */
  public async getGroupMembers(
    groupId: number,
  ): Promise<GroupMemberList | null> {
    const state = await this.ready;
    const groupMembers = state.groupMembers.get(groupId);
    if (!groupMembers || !groupMembers.isLoaded) {
      const group = await this.getGroup(groupId);
      if (group) {
        const members = await this.applyEntities(
          state,
          await this.rpc.loadGroupMembers(group.getGroupOutPeer()),
        );

        state.applyGroupMembers(groupId, members);
      }
    }

    return state.groupMembers.get(groupId) || null;
  }

  /**
   * Subscribes to messages stream.
   */
  public subscribeToMessages(): Observable<Message> {
    return this.subscribeToMessageUpdates().pipe(
      flatMap((update) => {
        return update.type === 'new' ? of(update.payload) : EMPTY;
      }),
    );
  }

  /**
   * Subscribes to messages stream.
   */
  public subscribeToMessageUpdates(): Observable<MessagingUpdate> {
    return this.updateSubject.pipe(
      flatMap((api) => {
        const update = parseMessagingUpdate(api);
        return update ? of(update) : EMPTY;
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
  ): Promise<Message> {
    const content = TextContent.create(text, normalizeArray(actionOrActions));

    return this.sendMessage(peer, content, attachment);
  }

  private async sendMessage(
    peer: Peer,
    content: Content,
    attachment?: null | MessageAttachment,
  ): Promise<Message> {
    const state = await this.ready;
    const outPeer = state.createOutPeer(peer);

    return combineLatest(
      this.updateSubject,
      this.rpc.sendMessage(outPeer, content, attachment),
    )
      .pipe(
        flatMap(
          ([
            { updateMessage, updateMessageSent, updateMessageRejectedByHook },
            dId,
          ]) => {
            if (updateMessage && updateMessage.peer && updateMessage.randomId) {
              const updatePeer = Peer.from(updateMessage.peer);
              if (
                dId.equals(updateMessage.randomId) &&
                peer.equals(updatePeer)
              ) {
                return of(Message.from(updateMessage));
              }
            }

            if (
              updateMessageSent &&
              updateMessageSent.mid &&
              updateMessageSent.peer
            ) {
              const updatePeer = Peer.from(updateMessageSent.peer);
              if (
                dId.equals(updateMessageSent.rid) &&
                peer.equals(updatePeer)
              ) {
                return of(
                  new Message(
                    UUID.from(updateMessageSent.mid),
                    peer,
                    dateFromLong(updateMessageSent.date),
                    content,
                    attachment || null,
                    state.self.id,
                    dateFromLong(updateMessageSent.date),
                  ),
                );
              }
            }

            if (
              updateMessageRejectedByHook &&
              updateMessageRejectedByHook.peer
            ) {
              const updatePeer = Peer.from(updateMessageRejectedByHook.peer);
              if (
                dId.equals(updateMessageRejectedByHook.rid) &&
                peer.equals(updatePeer)
              ) {
                throw new MessageRejectedError(
                  peer,
                  content,
                  updateMessageRejectedByHook.hookId,
                  getOpt(updateMessageRejectedByHook.reason, null),
                );
              }
            }

            return EMPTY;
          },
        ),
        first(),
      )
      .toPromise();
  }

  /**
   * Edits text message.
   *
   * @param id              The message id.
   * @param editedAt        The message last edit date.
   * @param text            Updated text.
   * @param actionOrActions The message actions.
   */
  public async editText(
    id: UUID,
    editedAt: Date,
    text: string,
    actionOrActions?: ActionGroup | ActionGroup[],
  ): Promise<void> {
    const content = TextContent.create(text, normalizeArray(actionOrActions));

    return this.rpc.editMessage(id, editedAt, content);
  }

  /**
   * Reads all messages before `since`.
   */
  public async readMessages(peer: Peer, since: Message): Promise<void> {
    const state = await this.ready;
    const outPeer = state.createOutPeer(peer);
    return this.rpc.readMessages(outPeer, since.date);
  }

  /**
   * Deletes text message.
   *
   * @param id       The message id.
   * @param editedAt The message last edit date.
   */
  public async deleteMessage(id: UUID, editedAt: Date): Promise<void> {
    return this.rpc.editMessage(id, editedAt, DeletedContent.create());
  }

  /**
   * Sends document message.
   */
  public async sendDocument(
    peer: Peer,
    fileName: string,
    attachment?: MessageAttachment,
  ): Promise<Message> {
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

    return this.sendMessage(peer, content, attachment);
  }

  /**
   * Sends image message.
   */
  public async sendImage(
    peer: Peer,
    fileName: string,
    attachment?: MessageAttachment,
  ): Promise<Message> {
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

    return this.sendMessage(peer, content, attachment);
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
   * Loads chat history.
   */
  public async loadHistory(
    peer: Peer,
    since: Message | null = null,
    limit = 10,
    direction = HistoryListMode.BACKWARD,
  ): Promise<Array<HistoryMessage>> {
    const state = await this.ready;
    const outPeer = state.createOutPeer(peer);
    return this.rpc.loadHistory(
      outPeer,
      since ? since.date : null,
      direction,
      limit,
    );
  }

  /**
   * Returns the parameter from key-value synced with the server.
   */
  public async getParameter(key: string): Promise<string | null> {
    const state = await this.ready;

    return state.parameters.get(key) || null;
  }

  /**
   * Sets the parameter from key-value synced with the server.
   */
  public async setParameter(key: string, value: string): Promise<void> {
    const state = await this.ready;

    await this.rpc.editParameter(key, value);

    state.parameters.set(key, value);
  }

  /**
   * Creates new group or channel.
   */
  public async createGroup(title: string, type: GroupType): Promise<Group> {
    const state = await this.ready;
    const group = await this.applyEntities(
      state,
      await this.rpc.createGroup(title, type),
    );

    return group;
  }

  /**
   * Leaves the group.
   */
  public async leaveGroup(group: Group): Promise<void> {
    await this.rpc.leaveGroup(group.getGroupOutPeer());
  }

  /**
   * Edits a group title.
   */
  public async editGroupTitle(group: Group, title: string): Promise<void> {
    await this.rpc.editGroupTitle(group.getGroupOutPeer(), title);
  }

  /**
   * Edits a group about (description).
   */
  public async editGroupAbout(
    group: Group,
    about: string | null,
  ): Promise<void> {
    await this.rpc.editGroupAbout(group.getGroupOutPeer(), about);
  }

  /**
   * Invites a user to the group.
   */
  public async inviteGroupMember(group: Group, user: User): Promise<void> {
    await this.rpc.inviteGroupMember(
      group.getGroupOutPeer(),
      user.getUserOutPeer(),
    );
  }

  /**
   * Kicks the member from the group.
   */
  public async kickGroupMember(group: Group, user: User): Promise<void> {
    await this.rpc.kickGroupMember(
      group.getGroupOutPeer(),
      user.getUserOutPeer(),
    );
  }

  /**
   * Fetches the group invite URL.
   */
  public async fetchGroupInviteUrl(group: Group): Promise<string> {
    return this.rpc.getGroupInviteUrl(group.getGroupOutPeer());
  }

  /**
   * Joins the group by invite token.
   */
  public async joinGroupByToken(token: string): Promise<Group> {
    return this.applyEntities(
      await this.ready,
      await this.rpc.joinGroupByToken(token),
    );
  }

  /**
   * Finds peer by username or shortname.
   */
  public async findPeer(nickOrShortName: string): Promise<Peer | null> {
    const state = await this.ready;
    return this.applyEntities(
      state,
      await this.rpc.resolvePeer(nickOrShortName),
    );
  }

  /**
   * Finds group by shortname.
   */
  public async findUserByNick(nick: string): Promise<User | null> {
    const peer = await this.findPeer(nick);
    if (peer && peer.type === PeerType.PRIVATE) {
      return this.getUser(peer.id);
    }

    return null;
  }

  /**
   * Finds group by shortname.
   */
  public async findGroupByShortname(shortname: string): Promise<Group | null> {
    const peer = await this.findPeer(shortname);
    if (peer && peer.type === PeerType.GROUP) {
      return this.getGroup(peer.id);
    }

    return null;
  }
}

export default Bot;

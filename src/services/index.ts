/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Config } from './Service';
import Users from './Users';
import Groups from './Groups';
import Search from './Search';
import Contacts from './Contacts';
import Messaging from './Messaging';
import Parameters from './Parameters';
import Registration from './Registration';
import MediaAndFiles from './MediaAndFiles';
import Authentication from './Authentication';
import SequenceAndUpdates from './SequenceAndUpdates';

class Services {
  public readonly users: Users;
  public readonly groups: Groups;
  public readonly search: Search;
  public readonly contacts: Contacts;
  public readonly messaging: Messaging;
  public readonly parameters: Parameters;
  public readonly registration: Registration;
  public readonly mediaAndFiles: MediaAndFiles;
  public readonly authentication: Authentication;
  public readonly sequenceAndUpdates: SequenceAndUpdates;

  constructor(config: Config) {
    this.users = new Users(config);
    this.groups = new Groups(config);
    this.search = new Search(config);
    this.contacts = new Contacts(config);
    this.messaging = new Messaging(config);
    this.parameters = new Parameters(config);
    this.registration = new Registration(config);
    this.mediaAndFiles = new MediaAndFiles(config);
    this.authentication = new Authentication(config);
    this.sequenceAndUpdates = new SequenceAndUpdates(config);
  }

  public close() {
    this.users.close();
    this.groups.close();
    this.search.close();
    this.contacts.close();
    this.messaging.close();
    this.parameters.close();
    this.registration.close();
    this.mediaAndFiles.close();
    this.authentication.close();
    this.sequenceAndUpdates.close();
  }
}

export default Services;

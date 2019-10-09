/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Config } from './Service';
import Groups from './Groups';
import Contacts from './Contacts';
import Messaging from './Messaging';
import Parameters from './Parameters';
import Registration from './Registration';
import MediaAndFiles from './MediaAndFiles';
import Authentication from './Authentication';
import SequenceAndUpdates from './SequenceAndUpdates';

class Services {
  public readonly contacts: Contacts;
  public readonly messaging: Messaging;
  public readonly groupsService: Groups;
  public readonly parameters: Parameters;
  public readonly registration: Registration;
  public readonly mediaAndFiles: MediaAndFiles;
  public readonly authentication: Authentication;
  public readonly sequenceAndUpdates: SequenceAndUpdates;

  constructor(config: Config) {
    this.contacts = new Contacts(config);
    this.messaging = new Messaging(config);
    this.groupsService = new Groups(config);
    this.parameters = new Parameters(config);
    this.registration = new Registration(config);
    this.mediaAndFiles = new MediaAndFiles(config);
    this.authentication = new Authentication(config);
    this.sequenceAndUpdates = new SequenceAndUpdates(config);
  }

  public close() {
    this.contacts.close();
    this.messaging.close();
    this.parameters.close();
    this.registration.close();
    this.mediaAndFiles.close();
    this.groupsService.close();
    this.authentication.close();
    this.sequenceAndUpdates.close();
  }
}

export default Services;

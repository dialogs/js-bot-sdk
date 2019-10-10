/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { dialog } from '@dlghq/dialog-api';

enum GroupPermission {
  UNKNOWN = 0,
  EDIT_SHORTNAME = 1,
  INVITE = 2,
  KICK = 3,
  UPDATE_INFO = 4,
  SET_PERMISSIONS = 5,
  EDIT_MESSAGE = 6,
  DELETE_MESSAGE = 7,
  GET_INTEGRATION_TOKEN = 8,
  SEND_MESSAGE = 9,
  PIN_MESSAGE = 10,
  VIEW_MEMBERS = 11,
}

export function groupPermissionFromApi(
  type: dialog.GroupAdminPermission,
): GroupPermission {
  switch (type) {
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_EDITSHORTNAME:
      return GroupPermission.EDIT_SHORTNAME;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_INVITE:
      return GroupPermission.INVITE;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_KICK:
      return GroupPermission.KICK;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_UPDATEINFO:
      return GroupPermission.UPDATE_INFO;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_SETPERMISSIONS:
      return GroupPermission.SET_PERMISSIONS;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_EDITMESSAGE:
      return GroupPermission.EDIT_MESSAGE;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_DELETEMESSAGE:
      return GroupPermission.DELETE_MESSAGE;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_GETINTEGRATIONTOKEN:
      return GroupPermission.GET_INTEGRATION_TOKEN;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_SENDMESSAGE:
      return GroupPermission.SEND_MESSAGE;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_PINMESSAGE:
      return GroupPermission.PIN_MESSAGE;
    case dialog.GroupAdminPermission.GROUPADMINPERMISSION_VIEWMEMBERS:
      return GroupPermission.VIEW_MEMBERS;
    default:
      return GroupPermission.UNKNOWN;
  }
}

export default GroupPermission;

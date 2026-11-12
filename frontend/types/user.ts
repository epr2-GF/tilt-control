
export type UserCapabilities = {
  manageUsers?: boolean;
  receiveNotifications?: boolean;
};

export type User = {
  id: string;
  username: string;
  password?: string;

  zones: string[];
  capabilities: UserCapabilities;

  disabled?: boolean;
  accessStart?: string;
  accessEnd?: string;
  remoteAccess?: boolean;
};

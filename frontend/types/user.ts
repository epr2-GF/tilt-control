
export type UserCapabilities = {
  manageUsers?: boolean;
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

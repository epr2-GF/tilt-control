export type User = {
  id: string;
  username: string;
  password: string;
  role: string;
  disabled?: boolean;

  accessStart?: string;
  accessEnd?: string;

};

export const users: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin",
    role: "admin",
    disabled: false,
    accessStart: "00:00",
    accessEnd: "23:59",


    
  },
  {
    id: "2",
    username: "andy",
    password: "andy",
    role: "visiteur",
    disabled: false,
    accessStart: "08:00",
    accessEnd: "17:00",

  },
];
export interface User {
  id: string;
  email: string | null;
  // adicionar campos necessários aqui
}

export interface State {
  users: User[];
}

export type Action =
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: User['id'] };

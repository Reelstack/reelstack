export interface State {
  users: Users[];
}

export type Action =
  | { type: 'SET_USERS'; payload: Users[] }
  | { type: 'ADD_USER'; payload: Users }
  | { type: 'UPDATE_USER'; payload: Users }
  | { type: 'DELETE_USER'; payload: number };

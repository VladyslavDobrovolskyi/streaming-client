// authMiddleware.ts
import { Middleware } from 'redux';
import { RootState } from '../redux/store';
import api from '../services/api';

const authMiddleware: Middleware = store => next => action => {
  const result = next(action);
  const state = store.getState() as RootState;

  // Проверка и добавление токена в headers
  if (state.auth.accessToken) {
    api.defaults.headers['Authorization'] = `Bearer ${state.auth.accessToken}`;
  }

  return result;
};

export default authMiddleware;
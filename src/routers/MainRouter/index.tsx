import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Login } from '../../pages/Login';
import { Home } from '../../pages/Home';
import { Profile } from '../../pages/Profile';
import { BackgroundBody } from '../../components/BackgroundBody';
import { GuardedRoute } from '../GuardedRoute';

export function MainRouter() {
  return (
    <BrowserRouter>
      <BackgroundBody />
      <Routes>
        <Route
          path='/'
          element={
            <GuardedRoute requireAuth={false}>
              <Login />
            </GuardedRoute>
          }
        />
        <Route
          path='/home/'
          element={
            <GuardedRoute requireAuth={true}>
              <Home />
            </GuardedRoute>
          }
        />
        <Route
          path='/profile/'
          element={
            <GuardedRoute requireAuth={true}>
              <Profile />
            </GuardedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

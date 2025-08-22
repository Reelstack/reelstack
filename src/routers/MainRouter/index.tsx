import { BrowserRouter, Route, Routes } from 'react-router';
import { Home } from '../../pages/Home';
import { Login } from '../../pages/Login';
import { Profile } from '../../pages/Profile';

export function MainRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/home/' element={<Home />} />
        <Route path='/profile/' element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

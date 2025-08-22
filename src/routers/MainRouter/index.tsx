import { BrowserRouter, Route, Routes } from 'react-router';
import { Login } from '../../pages/Login';
import { Home } from '../../pages/Home';
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

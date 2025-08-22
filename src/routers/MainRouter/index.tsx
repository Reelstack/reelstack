import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Login } from '../../pages/Login';
import { Home } from '../../pages/Home';
import { Profile } from '../../pages/Profile';
import { BackgroundBody } from '../../components/BackgroundBody';

export function MainRouter() {
  return (
    <BrowserRouter>
      <BackgroundBody />
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/home/' element={<Home />} />
        <Route path='/profile/' element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

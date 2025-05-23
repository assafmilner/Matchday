import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import VerifyEmail from './components/auth/VerifyEmail';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Profile from './pages/Profile'; 
import { UserProvider, useUser } from './components/context/UserContext';
import teamColors from './utils/teamStyles';
import Fixtures from './pages/fixtures';


function ColorManager() {
  const { user } = useUser();

  useEffect(() => {
    const colors = teamColors[user?.favoriteTeam];
    if (colors) {
      document.documentElement.style.setProperty("--color-primary", colors.primary);
      document.documentElement.style.setProperty("--color-secondary", colors.secondary);
    }
  }, [user?.favoriteTeam]);

  return null;
}

function App() {
  return (
    
      <UserProvider>
        <BrowserRouter>
        <ColorManager />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/home" element={<Home />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/fixtures" element={<Fixtures/>} />
              <Route path="/" element={<Login />} />
            </Routes>
          <ColorManager />
        </BrowserRouter>
      </UserProvider>
    
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { StudentLoginPortal } from './StudentLoginPortal';
import { CanteenLoginPortal } from './CanteenLoginPortal';
import { AdminLoginPortal } from './AdminLoginPortal';
import { StudentProfileSetup } from './StudentProfileSetup';

interface LoginProps {
  onLogin: (user: User) => void;
  portal?: 'student' | 'canteen' | 'admin' | 'profile-setup';
}

export const Login: React.FC<LoginProps> = ({ onLogin, portal: propPortal }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Determine active portal from props or URL pathname
  const path = currentPath.toLowerCase();

  if (propPortal === 'canteen' || path.startsWith('/login/canteen')) {
    return <CanteenLoginPortal onLogin={onLogin} onNavigate={handleNavigate} />;
  }

  if (propPortal === 'admin' || path.startsWith('/login/admin')) {
    return <AdminLoginPortal onLogin={onLogin} onNavigate={handleNavigate} />;
  }

  if (propPortal === 'profile-setup' || path.startsWith('/profile-setup')) {
    return (
      <StudentProfileSetup 
        email="sanjay.26k24@kprcas.ac.in" 
        initialName="Sanjay N"
        onSuccess={onLogin}
        onBack={() => handleNavigate('/login')}
      />
    );
  }

  // Requirement 1: The main `/login` page must display only the Student Login option.
  // Do not display Canteen Login or Admin Login on the main student login page.
  return <StudentLoginPortal onLogin={onLogin} onNavigate={handleNavigate} />;
};

export default Login;

import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Activity, LogOut, Radio, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout, updateLocation } = useContext(AuthContext);

  const toggleStatus = () => {
    if (!user) return;
    const newStatus = user.status === 'active' ? 'idle' : 'active';
    updateLocation(
      user.location?.coordinates[0] || 0,
      user.location?.coordinates[1] || 0,
      newStatus
    );
  };

  // This component is now mostly replaced by the inline nav in Dashboard
  // Keeping it for compatibility but styling to match dark theme
  return null;
};

export default Navbar;

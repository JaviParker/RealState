import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

// Import your navigation stacks
// import AuthStack from './AuthStack';
// import AppTabs from './AppTabs';

export default function RootNavigator() {
  const { user } = useAuth(); // Get the user from the context

  return (
    <NavigationContainer>
      {/*
        If user is null, show AuthStack (Login, Register).
        If user exists, show AppTabs (Home, Profile, etc.).
        
        We will need to create AuthStack and AppTabs in our next steps.
      */}

      {/* Placeholder until we build the stacks */}
      {/* {user ? <AppTabs /> : <AuthStack />} */}
    </NavigationContainer>
  );
}
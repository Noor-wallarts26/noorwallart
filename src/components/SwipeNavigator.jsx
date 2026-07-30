import React from 'react';

const SwipeNavigator = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {children}
    </div>
  );
};

export default SwipeNavigator;

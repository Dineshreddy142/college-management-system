import React from 'react';
import App from '../../app/App';

export const ParentApp: React.FC = () => {
  return <App portalName="parent" portalRole="PARENT" />;
};

export default ParentApp;

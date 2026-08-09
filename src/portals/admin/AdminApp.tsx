import React from 'react';
import App from '../../app/App';

export const AdminApp: React.FC = () => {
  return <App portalName="admin" portalRole="ADMIN" />;
};

export default AdminApp;

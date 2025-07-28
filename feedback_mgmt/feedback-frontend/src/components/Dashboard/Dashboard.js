// src/components/Dashboard/Dashboard.js
import React, { useContext } from 'react';
import {AuthContext} from '../../context/AuthContext';
import DashboardView from './DashboardView';       // ✅ Your actual admin dashboard
import RedditStyle from './RedditStyle';           // ✅ Contributor's dashboard

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <div>Loading...</div>;

  return (
    <>
      {user.role === 'admin' ? <DashboardView /> : <RedditStyle />}
    </>
  );
};

export default Dashboard;

// src/components/PrivateRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        // Redirect to login page if not authenticated
        return <Navigate to="/login" replace />;
    }

    // No role restriction here; all logged-in users can access pages

    return children;
};

export default PrivateRoute;
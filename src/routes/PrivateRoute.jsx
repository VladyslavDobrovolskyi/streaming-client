import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ element: Element }) => {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const isLoading = useSelector((state) => state.auth.isLoading);

    if (isLoading) {
        return <div>Loading...</div>;
    }
    return isAuthenticated ? <Element /> : <Navigate to="/login" />;
};

export default PrivateRoute;

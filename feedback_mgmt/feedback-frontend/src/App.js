import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import { AuthProvider, AuthContext } from './context/AuthContext';
import './components/Layout/Layout.css';

import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import BoardsPage from './components/Boards/BoardsPage';
import UserBoardsPage from './components/Boards/UserBoardsPage';
import BoardDetail from './components/Boards/BoardDetails';
import KanbanPage from './components/Feedback/KanbanBoard';
import TableView from './components/Feedback/TableView';
import PrivateRoute from './components/PrivateRoute';

const Unauthorized = () => <h3>You do not have permission to view this page.</h3>;

const Sidebar = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    
    // Hide sidebar on login and signup pages
    if (['/login', '/signup'].includes(location.pathname)) return null;
    
    // No need to get username initial here as it's used in Header component
    
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <Link to="/" className="sidebar-logo">
                    <span>Feedback System</span>
                </Link>
            </div>
            <ul className="nav-links">
                <li className="nav-item">
                    <Link to="/" className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}>
                        <span className="nav-link-icon">📊</span>
                        <span>Dashboard</span>
                    </Link>
                </li>
                {user?.role === 'admin' && (
                    <li className="nav-item">
                        <Link to="/boards" className={location.pathname === '/boards' ? 'nav-link active' : 'nav-link'}>
                            <span className="nav-link-icon">🔧</span>
                            <span>Admin Boards</span>
                        </Link>
                    </li>
                )}
                <li className="nav-item">
                    <Link to="/user-boards" className={location.pathname === '/user-boards' ? 'nav-link active' : 'nav-link'}>
                        <span className="nav-link-icon">📋</span>
                        <span>User Boards</span>
                    </Link>
                </li>
                <li className="nav-item">
                    <Link to="/kanban" className={location.pathname === '/kanban' ? 'nav-link active' : 'nav-link'}>
                        <span className="nav-link-icon">📝</span>
                        <span>Kanban</span>
                    </Link>
                </li>
                <li className="nav-item">
                    <Link to="/table" className={location.pathname === '/table' ? 'nav-link active' : 'nav-link'}>
                        <span className="nav-link-icon">📊</span>
                        <span>Table View</span>
                    </Link>
                </li>
            </ul>
        </div>
    );
};

const Header = () => {
    const { user, logoutUser } = useContext(AuthContext);
    const location = useLocation();

    // Hide header on login and signup pages
    if (['/login', '/signup'].includes(location.pathname)) return null;
    
    if (!user) return null;
    
    // User is available for display

    return (
        <header className="header">
            <div>
                <h1 className="dashboard-title">Feedback Management System</h1>
            </div>
            <div className="user-menu">
                <div className="user-info">
                    <div className="user-avatar">{user.username ? user.username.charAt(0).toUpperCase() : ''}</div>
                    <div>
                        <div className="user-name">{user.username}</div>
                        <div className="user-role">{user.role}</div>
                    </div>
                </div>
                <button onClick={logoutUser} className="logout-button">
                    Logout
                </button>
            </div>
        </header>
    );
};

function AppRoutes() {
    const location = useLocation();
    const isAuthPage = ['/login', '/signup'].includes(location.pathname);
    
    return (
        <>
            {isAuthPage ? (
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                </Routes>
            ) : (
                <div className="layout-container">
                    <Sidebar />
                    <div className="main-content">
                        <Header />
                        <Routes>
                            <Route path="/unauthorized" element={<Unauthorized />} />

                            <Route
                                path="/"
                                element={
                                    <PrivateRoute>
                                        <Dashboard />
                                    </PrivateRoute>
                                }
                            />

                            <Route
                                path="/boards"
                                element={
                                    <PrivateRoute>
                                        <BoardsPage />
                                    </PrivateRoute>
                                }
                            />

                            <Route
                                path="/user-boards"
                                element={
                                    <PrivateRoute>
                                        <UserBoardsPage />
                                    </PrivateRoute>
                                }
                            />

                            <Route
                                path="/kanban"
                                element={
                                    <PrivateRoute>
                                        <KanbanPage />
                                    </PrivateRoute>
                                }
                            />
                            
                            <Route
                                path="/table"
                                element={
                                    <PrivateRoute>
                                        <TableView />
                                    </PrivateRoute>
                                }
                            />
                            
                            <Route
                                path="/board/:boardId"
                                element={
                                    <PrivateRoute>
                                        <BoardDetail />
                                    </PrivateRoute>
                                }
                            />
                        </Routes>
                    </div>
                </div>
            )}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

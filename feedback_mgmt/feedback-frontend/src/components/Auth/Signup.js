import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';

const Signup = () => {
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });

    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            // ✅ Register user (role defaults to contributor on backend)
            await axios.post('/register/', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });

            // ✅ Auto login after registration
            await loginUser({
                username: formData.username,
                password: formData.password,
            });

            // ✅ Redirect to home/dashboard
            navigate('/');
        } catch (err) {
            console.error('Signup error:', err.response?.data || err.message);

            // ✅ Display DRF errors if available
            if (err.response?.data) {
                const messages = Object.entries(err.response.data)
                    .map(([key, value]) => `${key}: ${value.join(' ')}`)
                    .join('\n');
                setError(messages);
            } else {
                setError('Signup failed. Please try again.');
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Signup</h2>
                {error && <pre className="error-message" style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
                    </div>
                    <button type="submit" className="btn-primary">Sign Up</button>
                </form>
                <p className="auth-link">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;

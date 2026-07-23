import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';
import './Auth.css';

const Login = ({ embedded = false }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // If user was redirected here from checkout, we will send them back after login
  const from = location.state?.from?.pathname || '/';
  const customMessage = location.state?.message || 'Login to your Noor Wall Arts account';

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already registered. Please login instead.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const content = (
      <div className="auth-container card" style={embedded ? { margin: 0, width: '100%', boxShadow: '0 4px 20px rgba(90, 45, 12, 0.08)' } : {}}>
        <div className="auth-header">
          <img src="/logo.jpg" alt="Noor Wall Arts Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />
          <h2 className="brand-title">Noor Wall Arts</h2>
          <p>{customMessage}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button 
          type="button" 
          className="btn-outline google-btn" 
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', color: '#444', fontWeight: 'bold' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" style={{ width: '20px' }} />
          Sign in with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 10px' }}>or {isSignUp ? 'sign up' : 'login'} with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        <form className="auth-form" onSubmit={handleEmailAuth}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 chars)"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              minLength="6"
            />
          </div>
          
          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading} style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem', borderRadius: '8px' }}>
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Login')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {isSignUp ? (
            <p>Already have an account? <span onClick={() => {setIsSignUp(false); setError('');}} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Login here</span></p>
          ) : (
            <p>Don't have an account? <span onClick={() => {setIsSignUp(true); setError('');}} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Sign up</span></p>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="auth-page animate-fade-in">
      {content}
    </div>
  );
};

export default Login;

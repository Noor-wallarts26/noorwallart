import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';
import './Auth.css';

const Login = () => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('PHONE'); // 'PHONE' or 'OTP'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // If user was redirected here from checkout, we will send them back after login
  const from = location.state?.from?.pathname || '/';
  const customMessage = location.state?.message || 'Login to your Noor Wall Arts account';

  useEffect(() => {
    // Initialize recaptcha when component mounts
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            setError("reCAPTCHA expired, please try again.");
          }
        });
      } catch(err) {
        console.error("Recaptcha init error:", err);
      }
    }
    
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const requestOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic phone validation
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = countryCode + formattedPhone;
    }

    if (formattedPhone.length < 8) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep('OTP');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Phone Authentication is not enabled in Firebase. Please enable it in the Firebase Console.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format.');
      } else {
        setError('Failed to send OTP. Please try again. (' + err.message + ')');
      }
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          window.grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // Login successful, redirect back to where they came from
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container card">
        <div className="auth-header">
          <img src="/logo.jpg" alt="Noor Wall Arts Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />
          <h2 className="brand-title">Noor Wall Arts</h2>
          <p>{customMessage}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div id="recaptcha-container"></div>

        {step === 'PHONE' ? (
          <form className="auth-form" onSubmit={requestOTP}>
            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)}
                  style={{ width: '80px', textAlign: 'center', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+60">🇲🇾 +60</option>
                  <option value="+966">🇸🇦 +966</option>
                  <option value="+974">🇶🇦 +974</option>
                  <option value="+965">🇰🇼 +965</option>
                  <option value="+968">🇴🇲 +968</option>
                  <option value="+973">🇧🇭 +973</option>
                  <option value="+94">🇱🇰 +94</option>
                </select>
                <input 
                  type="tel" 
                  required 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mobile number"
                  maxLength="15"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading || phoneNumber.length < 5}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={verifyOTP}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input 
                type="text" 
                required 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                maxLength="6"
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
              />
              <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                OTP sent to {countryCode} {phoneNumber} <button type="button" onClick={() => setStep('PHONE')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>Change</button>
              </small>
            </div>
            
            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading || otp.length < 6}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

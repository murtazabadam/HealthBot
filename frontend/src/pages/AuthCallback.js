import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const token   = params.get('token');
    const user    = params.get('user');
    const error   = params.get('error');

    if (error) {
      navigate('/login?error=auth_failed');
      return;
    }

    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', decodeURIComponent(user));
      navigate('/chat');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', color:'#e2e8f0' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'24px', marginBottom:'16px' }}>⚕️ HealthBot</div>
        <p>Completing sign in...</p>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⚕️ HealthBot</div>
        <p style={styles.subtitle}>AI Medical Assistant</p>
        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="email" placeholder="Email"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input style={styles.input} type="password" placeholder="Password"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit">Login</button>
        </form>
        <p style={styles.link}>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center' },
  card: { background:'#1e293b', padding:'40px', borderRadius:'16px', width:'100%', maxWidth:'400px', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' },
  logo: { fontSize:'28px', fontWeight:'700', color:'#38bdf8', textAlign:'center', marginBottom:'4px' },
  subtitle: { color:'#64748b', textAlign:'center', marginBottom:'28px', fontSize:'14px' },
  input: { width:'100%', padding:'12px 16px', marginBottom:'12px', borderRadius:'8px', border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0', fontSize:'14px', boxSizing:'border-box' },
  btn: { width:'100%', padding:'12px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', marginTop:'4px' },
  error: { color:'#ef4444', fontSize:'13px', marginBottom:'8px' },
  link: { textAlign:'center', marginTop:'16px', color:'#64748b', fontSize:'13px' }
};
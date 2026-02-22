import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import useResponsive from '../hooks/useResponsive';

const Login = () => {
    const location = useLocation();
    const { isMobile } = useResponsive();
    const [isRegister, setIsRegister] = useState(location.pathname === '/register');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [accountType, setAccountType] = useState('customer'); // 'customer' | 'seller'
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const inputStyle = {
        width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #d1d5db',
        borderRadius: '4px', fontSize: '14px', outline: 'none', background: '#fff',
        color: '#212121', boxSizing: 'border-box'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        let result;
        if (isRegister) {
            if (!name.trim()) { setError('Please enter your name'); setLoading(false); return; }
            result = await register(name, email, password, accountType === 'seller');
        } else {
            result = await login(email, password);
        }
        setLoading(false);
        if (result.success) {
            if (isRegister && accountType === 'seller') navigate('/seller');
            else navigate('/');
        } else {
            setError(result.message);
        }
    };

    const fillDemo = () => { setEmail('user@example.com'); setPassword('password123'); setIsRegister(false); };
    const fillSeller = () => { setEmail('seller@apnidunia.com'); setPassword('seller123'); setIsRegister(false); };

    return (
        <div style={{ background: '#f1f3f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
            <div style={{ width: '100%', maxWidth: isMobile ? '420px' : '750px', background: 'white', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden', display: 'flex', minHeight: isMobile ? 'auto' : '480px' }}>

                {/* Left Blue Panel — hidden on mobile */}
                {!isMobile && (
                <div style={{ background: '#2874f0', width: '42%', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '12px', lineHeight: 1.3 }}>
                            {isRegister ? "Looks like you're new here!" : 'Login'}
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: 1.6 }}>
                            {isRegister
                                ? 'Sign up with your email to get started'
                                : 'Get access to your Orders, Wishlist and Recommendations'}
                        </p>
                    </div>
                    <img
                        src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop"
                        alt="Shopping"
                        style={{ borderRadius: '8px', width: '100%', objectFit: 'cover', maxHeight: '200px', opacity: 0.85 }}
                    />
                </div>
                )}

                {/* Right Form Panel */}
                <div style={{ flex: 1, padding: isMobile ? '28px 20px' : '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {/* Logo (shown always for branding) */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <span style={{ fontSize: '22px', fontWeight: 700, color: '#2874f0' }}>ApniDunia</span>
                    </div>

                    {/* Tab Switch */}
                    <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
                        {['Login', 'Register'].map((tab, i) => {
                            const active = i === 0 ? !isRegister : isRegister;
                            return (
                                <button key={tab} onClick={() => { setIsRegister(i === 1); setError(''); }}
                                    style={{ flex: 1, padding: '8px', fontSize: '14px', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', borderBottom: active ? '2px solid #2874f0' : '2px solid transparent', color: active ? '#2874f0' : '#878787', transition: 'all 0.2s' }}>
                                    {tab}
                                </button>
                            );
                        })}
                    </div>

                    {error && (
                        <div style={{ background: '#fdecea', border: '1px solid #ef9a9a', color: '#c62828', padding: '10px 12px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {isRegister && (
                            <>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#9ca3af', zIndex: 1 }} />
                                    <input type="text" placeholder="Full Name" value={name}
                                        onChange={e => setName(e.target.value)} required={isRegister} style={inputStyle} />
                                </div>

                                {/* Account Type Toggle */}
                                <div>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '8px' }}>Account Type</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[
                                            { id: 'customer', label: '🛒 Customer', desc: 'Shop products' },
                                            { id: 'seller', label: '🏪 Seller', desc: 'List & sell products' }
                                        ].map(t => (
                                            <button key={t.id} type="button" onClick={() => setAccountType(t.id)}
                                                style={{ flex: 1, padding: '10px 8px', border: `2px solid ${accountType === t.id ? '#2874f0' : '#e0e0e0'}`, borderRadius: '6px', background: accountType === t.id ? '#e8f0fe' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: accountType === t.id ? '#2874f0' : '#555' }}>{t.label}</div>
                                                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{t.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                    {accountType === 'seller' && (
                                        <p style={{ fontSize: '11px', color: '#388e3c', marginTop: '6px', fontWeight: 500 }}>
                                            ✓ You'll get a Seller Panel to list and manage your products
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#9ca3af', zIndex: 1 }} />
                            <input type="email" placeholder="Email Address" value={email}
                                onChange={e => setEmail(e.target.value)} required style={inputStyle} />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#9ca3af', zIndex: 1 }} />
                            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
                                onChange={e => setPassword(e.target.value)} required
                                style={{ ...inputStyle, paddingRight: '40px' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
                            By continuing, you agree to ApniDunia's{' '}
                            <a href="#" style={{ color: '#2874f0' }}>Terms of Use</a> and{' '}
                            <a href="#" style={{ color: '#2874f0' }}>Privacy Policy</a>.
                        </p>

                        <button type="submit" disabled={loading}
                            style={{ width: '100%', padding: '12px', fontWeight: 700, fontSize: '14px', borderRadius: '4px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? '#ccc' : '#fb641b', color: 'white' }}>
                            {loading ? (isRegister ? 'Creating Account...' : 'Logging in...') : (isRegister ? 'Create Account' : 'Login')}
                        </button>
                    </form>

                    {!isRegister && (
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div onClick={fillDemo} style={{ padding: '10px 12px', borderRadius: '4px', border: '1px solid #ffe082', background: '#fff8e1', fontSize: '12px', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fff3cd'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff8e1'}>
                                <p style={{ fontWeight: 700, color: '#795548', margin: '0 0 2px' }}>🔑 Demo Customer — Click to Auto-fill</p>
                                <p style={{ color: '#6d4c41', margin: 0 }}>user@example.com / <span style={{ fontFamily: 'monospace' }}>password123</span></p>
                            </div>
                            <div onClick={fillSeller} style={{ padding: '10px 12px', borderRadius: '4px', border: '1px solid #a5d6a7', background: '#e8f5e9', fontSize: '12px', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#c8e6c9'}
                                onMouseLeave={e => e.currentTarget.style.background = '#e8f5e9'}>
                                <p style={{ fontWeight: 700, color: '#2e7d32', margin: '0 0 2px' }}>🏪 Demo Seller — Click to Auto-fill</p>
                                <p style={{ color: '#1b5e20', margin: 0 }}>seller@apnidunia.com / <span style={{ fontFamily: 'monospace' }}>seller123</span></p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;

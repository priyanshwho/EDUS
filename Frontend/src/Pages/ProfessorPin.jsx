import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProfessorPinPage
 * Additional security layer — professors must enter their PIN after login.
 */
export default function ProfessorPinPage() {
  const { verifyPin } = useAuth();
  const navigate      = useNavigate();

  const [pin,     setPin]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyPin(pin);
      navigate('/dashboard/professor');
    } catch (err) {
      setError(err.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-n-8 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-n-6 bg-n-7 p-8 text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="h5 mb-2">Professor PIN Required</h1>
        <p className="text-sm text-n-4 mb-8">Enter your secure professor PIN to access the platform.</p>

        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-400/10 py-2 rounded-lg">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            placeholder="Enter PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            required
            className="w-full text-center text-2xl tracking-[0.5em] rounded-xl border border-n-6 bg-n-8 px-4 py-3 focus:outline-none focus:border-color-1"
          />
          <button
            type="submit" disabled={loading || pin.length < 4}
            className="w-full py-3 rounded-xl bg-color-1 text-n-8 font-semibold hover:bg-color-1/90 disabled:opacity-50 transition"
          >
            {loading ? 'Verifying…' : 'Verify PIN'}
          </button>
        </form>
      </div>
    </div>
  );
}

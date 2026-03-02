import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

type StoredUser = {
  username: string;
  password?: string;
  email?: string;
  provider: 'local' | 'gmail';
  createdAt: number;
};

type AuthStep = 'identifier' | 'password' | 'register';

const USERS_KEY = 'clubUsers';

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function ensureSampleUser() {
  const users = readUsers();
  const sampleUsername = 'sai';
  const samplePassword = 'sai123';
  const sampleEmail = 'sai@gmail.com';
  const existingIndex = users.findIndex((item) => item.username.toLowerCase() === sampleUsername && item.provider === 'local');

  if (existingIndex >= 0) {
    users[existingIndex] = {
      ...users[existingIndex],
      username: sampleUsername,
      password: samplePassword,
      email: users[existingIndex].email || sampleEmail,
      provider: 'local',
      createdAt: users[existingIndex].createdAt || Date.now(),
    };
    saveUsers(users);
    return;
  }

  saveUsers([
    ...users,
    {
      username: sampleUsername,
      password: samplePassword,
      email: sampleEmail,
      provider: 'local',
      createdAt: Date.now(),
    },
  ]);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('identifier');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [pendingUser, setPendingUser] = useState<StoredUser | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    ensureSampleUser();
    if (sessionStorage.getItem('logoutSuccess') === 'true') {
      setStatusMessage('Logged out successfully ✅');
      sessionStorage.removeItem('logoutSuccess');
    }
    if (localStorage.getItem('clubAuthUser')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const completeLogin = (loggedInUser: { name: string; username: string; provider: 'local' | 'gmail' }) => {
    localStorage.setItem(
      'clubAuthUser',
      JSON.stringify({
        name: loggedInUser.name,
        username: loggedInUser.username,
        provider: loggedInUser.provider,
        loggedInAt: Date.now(),
      }),
    );
    const returnRecipePath = sessionStorage.getItem('returnToRecipePath');
    if (returnRecipePath) {
      sessionStorage.removeItem('returnToRecipePath');
      navigate(returnRecipePath, { replace: true });
      return;
    }

    navigate('/', { replace: true });
  };

  const findUserByIdentifier = (identifier: string, users: StoredUser[]) => {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) return undefined;
    if (normalized.includes('@')) {
      return users.find((item) => (item.email ?? '').toLowerCase() === normalized);
    }
    return users.find((item) => item.username.toLowerCase() === normalized);
  };

  const handleIdentifierCheck = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    const normalizedIdentifier = loginIdentifier.trim().toLowerCase();
    if (!normalizedIdentifier) {
      setErrorMessage('Please enter username or Gmail.');
      return;
    }
    if (normalizedIdentifier.includes('@') && !normalizedIdentifier.endsWith('@gmail.com')) {
      setErrorMessage('Please use a Gmail address (example@gmail.com).');
      return;
    }

    const users = readUsers();
    const user = findUserByIdentifier(normalizedIdentifier, users);
    if (user) {
      if (!user.password) {
        setErrorMessage('Password is not set for this account. Please register again.');
        return;
      }
      setPendingUser(user);
      setStatusMessage(`Hi ${user.username} 👋 Please enter your password.`);
      setStep('password');
      return;
    }

    setErrorMessage('Account not found. Please register as a new user.');
  };

  const handlePasswordLogin = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!pendingUser) {
      setErrorMessage('Please enter username or Gmail first.');
      setStep('identifier');
      return;
    }

    if ((pendingUser.password ?? '') !== password) {
      setErrorMessage('Incorrect password. Please try again.');
      return;
    }

    completeLogin({ name: pendingUser.username, username: pendingUser.username, provider: pendingUser.provider });
  };

  const handleRegister = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    const normalizedUsername = registerUsername.trim().toLowerCase();
    const trimmedEmail = registerEmail.trim().toLowerCase();
    if (!normalizedUsername || !registerPassword.trim() || !trimmedEmail) {
      setErrorMessage('Username, email, and password are required.');
      return;
    }
    if (!trimmedEmail.endsWith('@gmail.com')) {
      setErrorMessage('Please enter a valid Gmail address.');
      return;
    }

    const users = readUsers();
    const exists = users.some(
      (item) =>
        item.username.toLowerCase() === normalizedUsername ||
        (!!trimmedEmail && (item.email ?? '').toLowerCase() === trimmedEmail),
    );
    if (exists) {
      setErrorMessage('Username or Gmail already exists. Please log in instead.');
      setStep('identifier');
      setLoginIdentifier(trimmedEmail || registerUsername);
      return;
    }

    const newUser: StoredUser = {
      username: registerUsername.trim(),
      password: registerPassword,
      email: trimmedEmail || undefined,
      provider: 'local',
      createdAt: Date.now(),
    };
    saveUsers([...users, newUser]);
    completeLogin({ name: newUser.username, username: newUser.username, provider: 'local' });
  };

  return (
    <main className="min-h-screen bg-dark text-white flex items-center justify-center px-4">
      <section className="w-full max-w-md border border-white/15 rounded-2xl p-8 bg-black/40 backdrop-blur">
        <p className="text-gold text-xs uppercase tracking-[0.25em] mb-3">Samsung Club Of Chefs</p>
        <h1 className="text-3xl font-serif mb-2">{step === 'register' ? 'Register' : 'Login'}</h1>
        <p className="text-white/70 text-sm mb-6">
          {step === 'register'
            ? 'Create your account with unique username, Gmail, and password.'
            : 'Login with username or Gmail, then enter password.'}
        </p>

        {statusMessage && <p className="text-emerald-400 text-sm mb-4">{statusMessage}</p>}
        {errorMessage && <p className="text-red-400 text-sm mb-4">{errorMessage}</p>}

        {step === 'identifier' && (
          <form onSubmit={handleIdentifierCheck} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="text-sm text-white/80 block mb-2">Username or Gmail</label>
              <input
                id="identifier"
                value={loginIdentifier}
                onChange={(event) => setLoginIdentifier(event.target.value)}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 outline-none focus:border-gold"
                placeholder="Enter username or example@gmail.com"
              />
            </div>
            <button type="submit" className="w-full btn-primary bg-gold text-dark hover:bg-gold-light">
              Continue
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('register');
                setErrorMessage('');
                setStatusMessage('');
              }}
              className="w-full border border-white/30 rounded-lg py-2 hover:border-gold transition-colors"
            >
              Create New Account
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="text-sm text-white/80 block mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 outline-none focus:border-gold"
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="w-full btn-primary bg-gold text-dark hover:bg-gold-light">
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('identifier');
                setPassword('');
                setPendingUser(null);
                setStatusMessage('');
              }}
              className="w-full border border-white/30 rounded-lg py-2 hover:border-gold transition-colors"
            >
              Back
            </button>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="registerUsername" className="text-sm text-white/80 block mb-2">Username</label>
              <input
                id="registerUsername"
                value={registerUsername}
                onChange={(event) => setRegisterUsername(event.target.value)}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 outline-none focus:border-gold"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label htmlFor="registerEmail" className="text-sm text-white/80 block mb-2">Email</label>
              <input
                id="registerEmail"
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 outline-none focus:border-gold"
                placeholder="example@gmail.com"
              />
            </div>
            <div>
              <label htmlFor="registerPassword" className="text-sm text-white/80 block mb-2">Password</label>
              <input
                id="registerPassword"
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 outline-none focus:border-gold"
                placeholder="Create a password"
              />
            </div>
            <button type="submit" className="w-full btn-primary bg-gold text-dark hover:bg-gold-light">
              Register & Login
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('identifier');
                setStatusMessage('');
              }}
              className="w-full border border-white/30 rounded-lg py-2 hover:border-gold transition-colors"
            >
              Back To Login
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full border border-gold text-gold rounded-lg py-2 hover:bg-gold/10 transition-colors"
          >
            Home
          </button>
        </div>
      </section>
    </main>
  );
}

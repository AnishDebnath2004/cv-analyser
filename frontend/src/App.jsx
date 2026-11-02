import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import AnalysisDashboard from './components/AnalysisDashboard';
import OccupationDetailModal from './components/OccupationDetailModal';
import AuthModal from './components/AuthModal';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [onetStatus, setOnetStatus] = useState({ connected: false, message: 'O*NET Knowledge Base Active' });
  const [authProvider, setAuthProvider] = useState('sqlite');
  const [selectedOccupation, setSelectedOccupation] = useState(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'

  // Fetch health and check existing auth session on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setOnetStatus({
          connected: data.onet_credentials_present,
          message: data.onet_credentials_present ? 'O*NET Live Web Services Active' : 'O*NET Curated Taxonomy Active',
        });
        if (data.auth_provider) {
          setAuthProvider(data.auth_provider);
        }
      })
      .catch((err) => console.error('Error fetching health:', err));

    // Verify saved auth session
    const savedToken = localStorage.getItem('pathfinder_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then((userData) => {
          setCurrentUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('pathfinder_token');
          localStorage.removeItem('pathfinder_user');
          setCurrentUser(null);
        });
    }
  }, []);

  const handleAuthSuccess = (user, token) => {
    localStorage.setItem('pathfinder_token', token);
    localStorage.setItem('pathfinder_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('pathfinder_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Logout request failed:', err);
      }
    }
    localStorage.removeItem('pathfinder_token');
    localStorage.removeItem('pathfinder_user');
    setCurrentUser(null);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const simulateStepProgress = () => {
    setLoadingStep('Ingesting document and extracting technical competencies...');
    const t1 = setTimeout(() => {
      setLoadingStep('Querying O*NET Web Services & SOC Occupational database...');
    }, 900);
    const t2 = setTimeout(() => {
      setLoadingStep('Calculating multi-dimensional skill and experience fit scores...');
    }, 1800);
    const t3 = setTimeout(() => {
      setLoadingStep('Performing deep gap analysis and career advisory synthesis...');
    }, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handleAnalyzeFile = async (file) => {
    setIsLoading(true);
    const cleanup = simulateStepProgress();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers = {};
      const token = localStorage.getItem('pathfinder_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/analyze/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = 'Analysis failed';
        try {
          const errorData = await res.json();
          errorMsg = errorData.detail || errorMsg;
        } catch {
          try {
            const rawText = await res.text();
            errorMsg = rawText.slice(0, 150) || errorMsg;
          } catch {
            errorMsg = `Server error (Status ${res.status})`;
          }
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      alert('Error analyzing resume: ' + err.message);
    } finally {
      cleanup();
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="app-container">
      <Navbar
        theme={theme}
        setTheme={setTheme}
        onReset={handleReset}
        hasResult={Boolean(analysisResult)}
        onetStatus={onetStatus}
        authProvider={authProvider}
        currentUser={currentUser}
        onOpenAuth={openAuthModal}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {!analysisResult ? (
          <UploadSection
            onAnalyzeFile={handleAnalyzeFile}
            isLoading={isLoading}
            loadingStep={loadingStep}
            currentUser={currentUser}
            onAuthSuccess={handleAuthSuccess}
            onLogout={handleLogout}
          />
        ) : (
          <AnalysisDashboard
            analysisResult={analysisResult}
            onSelectOccupation={(occ) => setSelectedOccupation(occ)}
          />
        )}
      </main>

      <OccupationDetailModal
        occupation={selectedOccupation}
        onClose={() => setSelectedOccupation(null)}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

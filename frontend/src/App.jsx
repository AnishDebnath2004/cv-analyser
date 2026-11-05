import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import AnalysisDashboard from './components/AnalysisDashboard';
import OccupationDetailModal from './components/OccupationDetailModal';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import ResumeBuilderModal from './components/ResumeBuilderModal';
import { extractTextFromFile } from './utils/documentParser';
import './App.css';

export default function App() {
  // Theme preference: 'light' | 'dark' | 'system'
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('pathfinder_theme_pref') || 'dark';
  });

  const getSystemTheme = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const pref = localStorage.getItem('pathfinder_theme_pref') || 'dark';
    return pref === 'system' ? getSystemTheme() : pref;
  });

  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [onetStatus, setOnetStatus] = useState({ connected: false, message: 'O*NET Knowledge Base Active' });
  const [selectedOccupation, setSelectedOccupation] = useState(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'

  // Settings modal state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('theme'); // 'theme' | 'mfa'

  // ATS Resume Builder modal state
  const [builderModalOpen, setBuilderModalOpen] = useState(false);

  // Apply theme and listen for OS system theme changes
  useEffect(() => {
    const applyTheme = (pref) => {
      const target = pref === 'system' ? getSystemTheme() : pref;
      setResolvedTheme(target);
      document.documentElement.setAttribute('data-theme', target);
    };

    applyTheme(themePreference);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleMediaChange = () => {
      if (themePreference === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [themePreference]);

  const handleThemeChange = (newPref) => {
    setThemePreference(newPref);
    localStorage.setItem('pathfinder_theme_pref', newPref);
  };

  const openSettings = (tab = 'theme') => {
    setSettingsInitialTab(tab);
    setSettingsModalOpen(true);
  };

  // Fetch health and check existing auth session on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setOnetStatus({
          connected: data.onet_credentials_present,
          message: data.onet_credentials_present ? 'O*NET Live Web Services Active' : 'O*NET Curated Taxonomy Active',
        });
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
    if (token) {
      localStorage.setItem('pathfinder_token', token);
    }
    if (user) {
      localStorage.setItem('pathfinder_user', JSON.stringify(user));
      setCurrentUser(user);
    }
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
    if (!file) return;

    // Check file size (Vercel serverless request body cap is 4.5MB)
    const MAX_SIZE_BYTES = 4.5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      alert(`The selected file is ${sizeMB}MB, which exceeds the 4.5MB upload limit. Please compress the file to analyze.`);
      return;
    }

    setIsLoading(true);
    setLoadingStep('Parsing document content...');

    // 1. Try client-side text extraction first
    // This transforms a 186KB - 4MB PDF/DOCX file into a 2KB - 8KB pure text payload,
    // which completely bypasses Vercel Python serverless 64KB pipe buffer limits and cellular dropouts.
    try {
      const extractedText = await extractTextFromFile(file);
      if (extractedText && extractedText.trim().length > 30) {
        setIsLoading(false);
        return await handleAnalyzeText(extractedText);
      }
    } catch (extractErr) {
      console.warn('Client-side extraction failed, trying direct server upload:', extractErr);
    }

    // 2. Direct server upload fallback (for small files under 50KB or where extraction failed)
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
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        alert('Network interrupted (Failed to fetch). Please check your internet connection and try again.');
      } else {
        alert('Error analyzing resume: ' + err.message);
      }
    } finally {
      cleanup();
      setIsLoading(false);
    }
  };

  const handleAnalyzeText = async (text) => {
    if (!text || !text.trim()) {
      alert('Please enter or paste your resume text.');
      return;
    }

    setIsLoading(true);
    const cleanup = simulateStepProgress();

    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('pathfinder_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/analyze/text', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error (${res.status})`);
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        alert('Network interrupted (Failed to fetch). Please check your internet connection and try again.');
      } else {
        alert('Error analyzing resume: ' + err.message);
      }
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
        onReset={handleReset}
        hasResult={Boolean(analysisResult)}
        currentUser={currentUser}
        onOpenAuth={openAuthModal}
        onOpenSettings={openSettings}
        onOpenBuilder={() => setBuilderModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {!analysisResult ? (
          <UploadSection
            onAnalyzeFile={handleAnalyzeFile}
            onAnalyzeText={handleAnalyzeText}
            onOpenBuilder={() => setBuilderModalOpen(true)}
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

      <SettingsModal
        isOpen={settingsModalOpen}
        initialTab={settingsInitialTab}
        onClose={() => setSettingsModalOpen(false)}
        themePreference={themePreference}
        resolvedTheme={resolvedTheme}
        onThemeChange={handleThemeChange}
        currentUser={currentUser}
        authToken={localStorage.getItem('pathfinder_token')}
        onUserUpdated={setCurrentUser}
        onOpenAuth={openAuthModal}
      />

      <ResumeBuilderModal
        isOpen={builderModalOpen}
        onClose={() => setBuilderModalOpen(false)}
        onAnalyzeResumeText={handleAnalyzeText}
        currentUser={currentUser}
      />
    </div>
  );
}

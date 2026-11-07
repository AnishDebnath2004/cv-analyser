import React, { useState, useEffect } from 'react';
import { Lock, UserPlus, LogIn, Sparkles } from 'lucide-react';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import AnalysisDashboard from './components/AnalysisDashboard';
import OccupationDetailModal from './components/OccupationDetailModal';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import ResumeBuilderModal from './components/ResumeBuilderModal';
import { extractTextFromFile, validateIsResume } from './utils/documentParser';
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
  const [uploadWarning, setUploadWarning] = useState(null);
  const [onetStatus, setOnetStatus] = useState({ connected: false, message: 'O*NET Knowledge Base Active' });
  const [selectedOccupation, setSelectedOccupation] = useState(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'
  const [authNoticeMessage, setAuthNoticeMessage] = useState('');

  // Anonymous guest analysis tracking (restriction: max 2 analyses without login)
  const [guestAnalysisCount, setGuestAnalysisCount] = useState(() => {
    return parseInt(localStorage.getItem('pathfinder_guest_analysis_count') || '0', 10);
  });

  // Settings modal state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('theme'); // 'theme' | 'mfa'

  // ATS Resume Builder modal state
  const [builderModalOpen, setBuilderModalOpen] = useState(false);

  // Routing state for dedicated standalone ATS Builder window ('home' | 'builder')
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/builder')) {
      return 'builder';
    }
    return 'home';
  });

  // Track popstate for routing
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/builder')) {
        setCurrentRoute('builder');
      } else {
        setCurrentRoute('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenBuilder = () => {
    // Restriction: User must sign up / log in to make a CV
    if (!currentUser) {
      localStorage.setItem('pathfinder_pending_builder', 'true');
      openAuthModal('signup', 'Please sign up or log in to create and download ATS-friendly resumes.');
      return;
    }

    // Open ATS Resume Builder in a separate window/tab
    const newWindow = window.open('/builder', '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Pop-up blocker fallback: switch route in current window
      window.history.pushState({}, '', '/builder');
      setCurrentRoute('builder');
    }
  };

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
    setAuthModalOpen(false);
    setAuthNoticeMessage('');

    // If user was prompted to authenticate to build a CV, proceed to open builder now
    if (localStorage.getItem('pathfinder_pending_builder') === 'true') {
      localStorage.removeItem('pathfinder_pending_builder');
      setTimeout(() => {
        const newWindow = window.open('/builder', '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.history.pushState({}, '', '/builder');
          setCurrentRoute('builder');
        }
      }, 250);
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

  const openAuthModal = (mode = 'login', notice = '') => {
    setAuthModalMode(mode);
    setAuthNoticeMessage(notice);
    setAuthModalOpen(true);
  };

  const simulateStepProgress = () => {
    setLoadingStep('Reading through your background and experience...');
    const t1 = setTimeout(() => {
      setLoadingStep('Comparing skills against occupational benchmarks...');
    }, 900);
    const t2 = setTimeout(() => {
      setLoadingStep('Evaluating role compatibility and career trajectories...');
    }, 1800);
    const t3 = setTimeout(() => {
      setLoadingStep('Preparing your personalized career insights...');
    }, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handleAnalyzeFile = async (file) => {
    if (!file) return;

    // Restriction 1: Anonymous users can only analyze up to 2 times without login
    if (!currentUser) {
      const currentCount = parseInt(localStorage.getItem('pathfinder_guest_analysis_count') || '0', 10);
      if (currentCount >= 2) {
        openAuthModal('signup', "You have used your 2 free resume evaluations. Please sign up or log in for unlimited analyses.");
        return;
      }
    }

    setUploadWarning(null);

    // Check file size (Vercel serverless request body cap is 4.5MB)
    const MAX_SIZE_BYTES = 4.5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      alert(`The selected file is ${sizeMB}MB, which exceeds the 4.5MB upload limit. Please compress the file to analyze.`);
      return;
    }

    setIsLoading(true);
    setLoadingStep('Reading document content...');

    // 1. Try client-side text extraction first
    try {
      const extractedText = await extractTextFromFile(file);
      if (extractedText && extractedText.trim().length > 30) {
        // Validate whether extracted text looks like a real resume
        const validation = validateIsResume(extractedText);
        if (!validation.isValid) {
          setIsLoading(false);
          setUploadWarning({
            filename: file.name,
            message: validation.reason || 'This document does not appear to be a resume. Please upload a valid resume or CV.'
          });
          return;
        }

        setIsLoading(false);
        return await handleAnalyzeText(extractedText, file.name);
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

      let rawText = '';
      try {
        rawText = await res.text();
      } catch {
        rawText = '';
      }

      let parsed = null;
      if (rawText && rawText.trim().length > 0) {
        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = null;
        }
      }

      if (!res.ok) {
        let errorMsg = parsed?.detail;
        if (!errorMsg && rawText && rawText.length < 250 && !rawText.includes('<html') && !rawText.includes('<!DOCTYPE')) {
          errorMsg = rawText.trim();
        }
        if (!errorMsg) {
          errorMsg = res.status >= 500
            ? 'A server error occurred. Please verify the backend server is running and try again.'
            : `Analysis failed (Status ${res.status})`;
        }

        // Check if server indicated rate limit / anonymous quota reached
        if (res.status === 403) {
          openAuthModal('signup', typeof errorMsg === 'string' ? errorMsg : "You have used your 2 free resume evaluations. Please sign up or log in for unlimited analyses.");
          return;
        }

        // Check if server indicated non-resume document
        if (res.status === 422 || (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('not a resume'))) {
          setUploadWarning({
            filename: file.name,
            message: typeof errorMsg === 'string' ? errorMsg : 'This document does not appear to be a resume. Please upload a valid resume or CV.'
          });
          return;
        }

        throw new Error(errorMsg);
      }

      setAnalysisResult(parsed || {});

      // Track successful analysis for anonymous guests
      if (!currentUser) {
        const prevCount = parseInt(localStorage.getItem('pathfinder_guest_analysis_count') || '0', 10);
        const nextCount = prevCount + 1;
        localStorage.setItem('pathfinder_guest_analysis_count', nextCount.toString());
        setGuestAnalysisCount(nextCount);
      }
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

  const handleAnalyzeText = async (text, fileName = '') => {
    if (!text || !text.trim()) {
      alert('Please enter or paste your resume text.');
      return;
    }

    // Restriction 1: Anonymous users can only analyze up to 2 times without login
    if (!currentUser) {
      const currentCount = parseInt(localStorage.getItem('pathfinder_guest_analysis_count') || '0', 10);
      if (currentCount >= 2) {
        openAuthModal('signup', "You have used your 2 free resume evaluations. Please sign up or log in for unlimited analyses.");
        return;
      }
    }

    setUploadWarning(null);

    // Validate if text is a resume
    const validation = validateIsResume(text);
    if (!validation.isValid) {
      setUploadWarning({
        filename: fileName || 'Uploaded Document',
        message: validation.reason || 'This document does not appear to be a resume. Please upload a valid resume or CV.'
      });
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

      let rawText = '';
      try {
        rawText = await res.text();
      } catch {
        rawText = '';
      }

      let parsed = null;
      if (rawText && rawText.trim().length > 0) {
        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = null;
        }
      }

      if (!res.ok) {
        let detailMsg = parsed?.detail;
        if (!detailMsg && rawText && rawText.length < 250 && !rawText.includes('<html') && !rawText.includes('<!DOCTYPE')) {
          detailMsg = rawText.trim();
        }
        if (!detailMsg) {
          detailMsg = res.status >= 500
            ? 'A server error occurred. Please verify the backend server is running and try again.'
            : `Analysis failed (Status ${res.status})`;
        }

        if (res.status === 403) {
          openAuthModal('signup', typeof detailMsg === 'string' ? detailMsg : "You have used your 2 free resume evaluations. Please sign up or log in for unlimited analyses.");
          return;
        }

        if (res.status === 422 || (typeof detailMsg === 'string' && detailMsg.toLowerCase().includes('not a resume'))) {
          setUploadWarning({
            filename: fileName || 'Uploaded Document',
            message: typeof detailMsg === 'string' ? detailMsg : 'This document does not appear to be a resume. Please upload a valid resume or CV.'
          });
          return;
        }

        throw new Error(detailMsg);
      }

      setAnalysisResult(parsed || {});

      // Track successful analysis for anonymous guests
      if (!currentUser) {
        const prevCount = parseInt(localStorage.getItem('pathfinder_guest_analysis_count') || '0', 10);
        const nextCount = prevCount + 1;
        localStorage.setItem('pathfinder_guest_analysis_count', nextCount.toString());
        setGuestAnalysisCount(nextCount);
      }
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

  // Cross-window message listener & pending resume analyze handler
  useEffect(() => {
    const handleCrossWindowMessage = (event) => {
      if (event.data && event.data.type === 'ANALYZE_RESUME' && event.data.text) {
        handleAnalyzeText(event.data.text);
      }
    };
    window.addEventListener('message', handleCrossWindowMessage);

    // Check if user redirected from builder with pending resume text
    const pendingText = localStorage.getItem('pathfinder_pending_analyze');
    if (pendingText) {
      localStorage.removeItem('pathfinder_pending_analyze');
      if (window.location.search.includes('analyze=1')) {
        window.history.replaceState({}, '', '/');
      }
      handleAnalyzeText(pendingText);
    }

    return () => window.removeEventListener('message', handleCrossWindowMessage);
  }, []);

  const handleReset = () => {
    setAnalysisResult(null);
  };

  // If in dedicated Standalone Builder window/tab
  if (currentRoute === 'builder') {
    // Restriction 2: User must sign up / log in to make CV
    if (!currentUser) {
      return (
        <div className="builder-auth-gate-page">
          <div className="builder-auth-gate-card animate-fade-in">
            <div className="builder-auth-gate-icon">
              <Lock size={30} />
            </div>
            <h2 className="builder-auth-gate-title">Sign In Required to Make a Resume</h2>
            <p className="builder-auth-gate-desc">
              Please create a free PathFinder account or sign in to use the ATS Resume Builder, customize section entries with live search, generate summaries with the AI agent, and download your CV in PDF format.
            </p>
            <div className="builder-auth-gate-actions">
              <button
                type="button"
                className="btn-primary builder-gate-btn"
                onClick={() => {
                  openAuthModal('signup', 'Sign up to create and download your ATS-friendly resume.');
                }}
              >
                <UserPlus size={16} />
                <span>Sign Up to Build CV</span>
              </button>
              <button
                type="button"
                className="btn-secondary builder-gate-btn"
                onClick={() => {
                  openAuthModal('login', 'Log in to continue building your resume.');
                }}
              >
                <LogIn size={16} />
                <span>Log In</span>
              </button>
              <button
                type="button"
                className="btn-ghost builder-gate-btn"
                onClick={() => {
                  if (window.opener && !window.opener.closed) {
                    window.close();
                  } else {
                    window.history.pushState({}, '', '/');
                    setCurrentRoute('home');
                  }
                }}
              >
                <span>Return to Resume Analyzer</span>
              </button>
            </div>
          </div>

          <AuthModal
            isOpen={authModalOpen}
            initialMode={authModalMode}
            noticeMessage={authNoticeMessage}
            onClose={() => {
              setAuthModalOpen(false);
              setAuthNoticeMessage('');
            }}
            onAuthSuccess={(user, token) => {
              handleAuthSuccess(user, token);
            }}
          />
        </div>
      );
    }

    return (
      <ResumeBuilderModal
        isOpen={true}
        isStandalone={true}
        onClose={() => {
          if (window.opener && !window.opener.closed) {
            window.close();
          } else {
            window.history.pushState({}, '', '/');
            setCurrentRoute('home');
          }
        }}
        onAnalyzeResumeText={handleAnalyzeText}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="app-container">
      <Navbar
        onReset={handleReset}
        hasResult={Boolean(analysisResult)}
        currentUser={currentUser}
        onOpenAuth={openAuthModal}
        onOpenSettings={openSettings}
        onOpenBuilder={handleOpenBuilder}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {!analysisResult ? (
          <UploadSection
            onAnalyzeFile={handleAnalyzeFile}
            onAnalyzeText={handleAnalyzeText}
            onOpenBuilder={handleOpenBuilder}
            isLoading={isLoading}
            loadingStep={loadingStep}
            currentUser={currentUser}
            guestAnalysisCount={guestAnalysisCount}
            onOpenAuth={openAuthModal}
            onAuthSuccess={handleAuthSuccess}
            onLogout={handleLogout}
            uploadWarning={uploadWarning}
            onClearWarning={() => setUploadWarning(null)}
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
        noticeMessage={authNoticeMessage}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNoticeMessage('');
        }}
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

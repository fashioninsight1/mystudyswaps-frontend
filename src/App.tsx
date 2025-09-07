import { Switch, Route } from "wouter";
import { queryClient, setAuthTokenGetter } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import PlanSelection from "@/pages/onboarding/PlanSelection";
import PaymentSuccess from "@/pages/onboarding/PaymentSuccess";
import PaymentCancel from "@/pages/onboarding/PaymentCancel";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import Landing from "@/pages/landing";
import StudentDashboard from "@/pages/student-dashboard";
import ParentDashboard from "@/pages/parent-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import NotFound from "@/pages/not-found";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Careers from "@/pages/careers";
import Press from "@/pages/press";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import LoginPage from "@/pages/login";


import Refer from "@/pages/refer";
import Sitemap from "@/pages/sitemap";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import FreeResources from "@/pages/free-resources";
import AuthCallback from "@/pages/auth/callback";
import ResetPassword from "@/pages/auth/reset-password";
import Subscribe from "@/pages/subscription/Subscribe";
import SubscriptionSuccess from "@/pages/subscription/Success";
import SubscriptionCancel from "@/pages/subscription/Cancel";
import React, { Component, ReactNode, useState, useEffect } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Application Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The application encountered an error. Please refresh the page to try again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  const { user, isLoading } = useAuth();
  const loading = isLoading;
  const [showTimeout, setShowTimeout] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Track page views when routes change
  
  // Initialize the auth token getter for the query client (not needed for child accounts)
  React.useEffect(() => {
    setAuthTokenGetter(() => "");
  }, []);
  
  // Handle role updates after authentication
  
  // Handle pending profile data from auth modal

  // Handle loading timeout properly with useEffect
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
      }, 3000); // Give more time for API calls to complete or fail

      return () => clearTimeout(timer);
    } else {
      setShowTimeout(false);
    }
  }, [loading]);

  // Show loading state or timeout to landing
  if (loading && !showTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated but user data is still loading, show loading state
  if (user && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Setting up your dashboard...</p>
          <p className="text-sm opacity-75 mt-2">Please wait while we load your profile</p>
        </div>
      </div>
    );
  }

  // Check if user needs onboarding (priority order matters!)
  // CRITICAL FIX: Prevent infinite loops between plan selection and subscription gate
  const isOnPlanSelectionPage = window.location.pathname === '/onboarding/plan-selection';
  const childrenSetupJustCompleted = sessionStorage.getItem('childrenSetupComplete') === 'true';
                            !isOnPlanSelectionPage && // Don't redirect if already on plan selection
                            (sessionStorage.getItem('needsOnboarding') === 'true' || 
                             (user && user.role === 'parent' && user.childrenSetupComplete === false));
  
  // 🔍 DEBUG: Log user onboarding status
  if (user && user.role === 'parent') {
    console.log('🔍 PARENT ONBOARDING DEBUG:', {
      email: user.email,
      firstName: user.firstName,
      childrenSetupComplete: user.childrenSetupComplete,
      sessionStorageFlag: sessionStorage.getItem('needsOnboarding')
    });
  }
  

  
  // 1. First priority: if user is authenticated and needs children setup
  }
  
  // 2. Second priority: if user needs basic profile onboarding
  if (user && (user as any).needsOnboarding) {
    setShowOnboarding(true);
  }
function MainComponent() {function MainComponent() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary">
      <Header />
      <Switch>
        {user && user.role === "student" ? (
          <Route path="/" component={StudentDashboard} />
        ) : user && (user.role === "parent" || user.role === "home_educator") ? (
          <Route path="/">
            {() => (
              <SubscriptionGate user={user}>
                <ParentDashboard />
              </SubscriptionGate>
            )}
          </Route>
        ) : user && user.role === "teacher" ? (
          <Route path="/" component={TeacherDashboard} />
        ) : user ? (
          // Authenticated but no specific role - redirect to onboarding
          <Route path="/" component={Landing} />
        ) : (
          <Route path="/" component={Landing} />
        )}
        
        {/* Public Pages */}
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/careers" component={Careers} />
        <Route path="/press" component={Press} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />


        <Route path="/refer" component={Refer} />
        <Route path="/sitemap" component={Sitemap} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:id" component={BlogPost} />
        <Route path="/free-resources" component={FreeResources} />
        
        {/* Auth Pages */}
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/auth/reset-password" component={ResetPassword} />
        
        {/* Subscription Pages */}
        <Route path="/subscription/subscribe" component={Subscribe} />
        <Route path="/subscription/success" component={SubscriptionSuccess} />
        <Route path="/subscription/cancel" component={SubscriptionCancel} />
        
        {/* Onboarding Pages */}
        <Route path="/onboarding/plan-selection" component={PlanSelection} />
        <Route path="/onboarding/payment-success" component={PaymentSuccess} />
        <Route path="/onboarding/payment-cancel" component={PaymentCancel} />
        
        {/* Login page for child accounts */}
        <Route path="/login" component={LoginPage} />
        
        {/* Dashboard route - simplified to prevent SSR issues */}
        <Route path="/dashboard" component={user && user.role === "student" ? StudentDashboard : 
                                            user && (user.role === "parent" || user.role === "home_educator") ? ParentDashboard :
                                            user && user.role === "teacher" ? TeacherDashboard : 
                                            Landing} />
        
        <Route component={NotFound} />
      </Switch>
      
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );

function App() {
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
    } else {
      // initGA();
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
            // <Toaster />
            <Router />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
}


function App() {
  return <MainComponent />;
}

export default App;

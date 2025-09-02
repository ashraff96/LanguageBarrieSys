import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const usePageNavigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.roles?.some(role => role.name === 'admin');

  // Navigation functions for different scenarios
  const navigateToHome = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const navigateAfterTaskCompletion = (taskType: string) => {
    // Show success message and redirect based on user preference
    setTimeout(() => {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }, 3000); // Wait 3 seconds to show success message
  };

  const navigateToPage = (pageName: string) => {
    const routes = {
      'home': isAdmin ? '/admin' : '/dashboard',
      'document-translator': '/document-translator',
      'voice-translator': '/voice-translator',
      'language-practice': '/language-practice',
      'rajabasha': '/rajabasha',
      'admin': '/admin',
      'dashboard': '/dashboard',
      'signin': '/signin',
      'index': '/',
      // Admin sub-routes
      'users': '/admin/users',
      'files': '/admin/files',
      'database': '/admin/database',
      'translations': '/admin/translations'
    };

    const route = routes[pageName as keyof typeof routes];
    if (route) {
      navigate(route);
    } else {
      console.warn(`Unknown page: ${pageName}`);
      navigateToHome();
    }
  };

  const getHomePage = () => {
    return isAdmin ? '/admin' : '/dashboard';
  };

  const getBreadcrumbs = (currentPage: string) => {
    const homePage = isAdmin ? 'Admin Dashboard' : 'Dashboard';
    const homeRoute = isAdmin ? '/admin' : '/dashboard';

    const breadcrumbMap = {
      '/': 'Home',
      '/dashboard': 'Dashboard',
      '/admin': 'Admin Dashboard',
      '/document-translator': 'Document Translator',
      '/voice-translator': 'Voice Translator',
      '/language-practice': 'Language Practice',
      '/rajabasha': 'Rajabasha',
      '/signin': 'Sign In'
    };

    const currentPageName = breadcrumbMap[currentPage as keyof typeof breadcrumbMap] || 'Unknown Page';

    return [
      { name: homePage, path: homeRoute },
      { name: currentPageName, path: currentPage }
    ];
  };

  return {
    navigateToHome,
    navigateAfterTaskCompletion,
    navigateToPage,
    getHomePage,
    getBreadcrumbs,
    isAdmin
  };
};

export default usePageNavigation;

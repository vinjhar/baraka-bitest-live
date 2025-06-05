import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Leaf, Loader2 } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      logout();
      setIsLoggingOut(false);
      setMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navbarClass = isScrolled 
    ? 'fixed w-full bg-primary shadow-md transition-all duration-300 z-50' 
    : 'fixed w-full bg-primary/80 backdrop-blur-sm transition-all duration-300 z-50';

  const navLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `font-medium transition-colors duration-200 hover:text-gold
      ${isScrolled ? 'text-cream hover:text-gold' : 'text-cream hover:text-gold'}
      ${isActive ? 'text-gold' : ''}`;
  };

  const mobileNavLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `block px-4 py-2 text-lg font-medium text-primary hover:bg-primary/10 rounded transition-colors duration-200
      ${isActive ? 'bg-primary/10 text-gold' : ''}`;
  };

  return (
    <nav className={navbarClass}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex items-center">
            <Leaf className={`w-6 h-6 ${isScrolled ? 'text-gold' : 'text-gold'} rotate-45`} />
            <div className="flex flex-col ml-2">
              <span className={`text-2xl font-serif ${isScrolled ? 'text-gold' : 'text-gold'}`}>
                Baraka
              </span>
              <span className={`text-sm font-medium tracking-wider ${isScrolled ? 'text-cream' : 'text-cream'}`}>
                BITES
              </span>
            </div>
          </div>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className={navLinkClass('/')}>Home</Link>
          <Link to="/sunnah-foods" className={navLinkClass('/sunnah-foods')}>Sunnah Foods</Link>
          <Link to="/blog" className={navLinkClass('/blog')}>Blog</Link>
          <Link to="/contact" className={navLinkClass('/contact')}>Contact</Link>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="px-4 py-2 rounded-md bg-gold text-primary font-medium hover:bg-gold/90 transition-colors duration-200"
              >
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-md border-2 border-gold text-gold font-medium hover:bg-gold/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          ) : (
            <Link 
              to="/auth" 
              className="px-4 py-2 rounded-md bg-gold text-primary font-medium hover:bg-gold/90 transition-colors duration-200"
            >
              Sign In
            </Link>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden focus:outline-none" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className={`w-6 h-6 ${isScrolled ? 'text-cream' : 'text-cream'}`} />
          ) : (
            <Menu className={`w-6 h-6 ${isScrolled ? 'text-cream' : 'text-cream'}`} />
          )}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-cream shadow-lg absolute top-16 left-0 right-0 z-20">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            <Link to="/" className={mobileNavLinkClass('/')} onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/sunnah-foods" className={mobileNavLinkClass('/sunnah-foods')} onClick={() => setMobileMenuOpen(false)}>
              Sunnah Foods
            </Link>
            <Link to="/blog" className={mobileNavLinkClass('/blog')} onClick={() => setMobileMenuOpen(false)}>
              Blog
            </Link>
            <Link to="/contact" className={mobileNavLinkClass('/contact')} onClick={() => setMobileMenuOpen(false)}>
              Contact
            </Link>
            
            <div className="pt-2 border-t border-primary/20">
              {isAuthenticated ? (
                <div className="flex flex-col space-y-3">
                  <Link 
                    to="/dashboard" 
                    className="px-4 py-2 text-center rounded-md bg-primary text-cream font-medium hover:bg-primary/90 transition-colors duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-4 py-2 text-center rounded-md border-2 border-primary text-primary font-medium hover:bg-primary/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      'Logout'
                    )}
                  </button>
                </div>
              ) : (
                <Link 
                  to="/auth" 
                  className="px-4 py-2 block text-center rounded-md bg-primary text-cream font-medium hover:bg-primary/90 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HeroSection: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: `url('https://images.pexels.com/photos/31116937/pexels-photo-31116937.jpeg')`,
          backgroundPosition: 'center',
        }}
      />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70 z-10" />
      
      {/* Content */}
      <div className="container mx-auto px-4 z-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight animate-fadeIn">
            Discover the <span className="text-gold">Blessings</span> of Halal Cooking
          </h1>
          
          <p className="text-xl text-cream/90 mb-8 animate-fadeIn animation-delay-200">
            AI-powered Halal recipes tailored to your ingredients. Embrace the tradition with modern convenience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-fadeIn animation-delay-400">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="px-8 py-3 bg-gold text-primary font-bold rounded-md hover:bg-gold/90 transition-colors duration-200 text-center"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link 
                to="/auth" 
                className="px-8 py-3 bg-gold text-primary font-bold rounded-md hover:bg-gold/90 transition-colors duration-200 text-center"
              >
                Get Started
              </Link>
            )}
            
            <Link 
              to="/sunnah-foods" 
              className="px-8 py-3 bg-transparent border-2 border-cream text-cream font-bold rounded-md hover:bg-cream/10 transition-colors duration-200 text-center"
            >
              Learn About Sunnah Foods
            </Link>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-cream rounded-t-[50%] z-20"></div>
    </div>
  );
};

export default HeroSection;
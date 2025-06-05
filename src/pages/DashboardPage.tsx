import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRecipes } from '../contexts/RecipeContext';
import RecipeCard from '../components/RecipeCard';
import RecipeGenerator from '../components/RecipeGenerator';
import SavedRecipesHero from '../components/SavedRecipesHero';
import SubscriptionManager from '../components/SubscriptionManager';
import UpgradeToPremium from '../components/UpgradeToPremium';
import { Crown, Utensils, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [CurrentUser, setCurrentUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const upgradeRef = useRef<HTMLDivElement>(null);

  const { savedRecipes, recipes } = useRecipes();

  useEffect(() => {
    document.title = 'Dashboard - Baraka Bites';
  }, []);
  useEffect(() => {
    const savedSection = document.getElementById('mysavedrecipies');
    if (savedSection) {
      savedSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
      } else {
        setCurrentUser(data);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Check subscription status from stripe_customers
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('stripe_customers')
      .select('premium_subscribed')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error("Subscription fetch error:", error);
          setIsSubscribed(false);
        } else {
          setIsSubscribed(data.premium_subscribed);
        }
      });
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const upadteGenerationLeft = async () => {
    if (!CurrentUser || CurrentUser.generations_left <= 0) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ generations_left: CurrentUser.generations_left - 1 })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error("Update generations_left error:", error);
      } else {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error("Unexpected error updating generations_left:", error);
    }
  };

  const scrollToUpgrade = () => {
    if (upgradeRef.current) {
      upgradeRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-cream py-16 min-h-screen mt-10">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            Welcome back, <span className="text-gold">{user.name}</span>
          </h1>
          <p className="text-gray-700">
            {isSubscribed && CurrentUser
              ? 'You have premium access with unlimited recipe generations.'
              : `You have used ${3 - (CurrentUser?.generations_left ?? 3)}/3 recipe generations.`

            }
          </p>
        </div>

        {!isSubscribed && (
          <div className="mb-8" ref={upgradeRef}>
            <UpgradeToPremium />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full mr-3">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary">Recipe Generations Left</h3>
            </div>
            <p className="text-3xl font-bold text-gold">
              {isSubscribed ? '∞' : CurrentUser?.generations_left ?? 0}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {isSubscribed ? 'Unlimited recipes' : 'Generations remaining'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full mr-3">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary">Account Type</h3>
            </div>
            <p className="text-3xl font-bold text-gold">
              {isSubscribed ? 'Premium' : 'Free'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {isSubscribed ? 'Premium features unlocked' : 'Limited features available'}
            </p>
          </div>
        </div>

        {isSubscribed && <SubscriptionManager />}

        {(isSubscribed || (CurrentUser && CurrentUser?.generations_left > 0)) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-6">Generate New Recipe</h2>
            <RecipeGenerator upadteGenerationLeft={upadteGenerationLeft} />
          </div>
        )}

        {!isSubscribed && CurrentUser?.generations_left === 0 && (
          <div className="mb-12 text-center">
            <p className="text-lg text-gray-700 mb-4">
              You've used all your free recipe generations.
            </p>
            <button
              onClick={scrollToUpgrade}
              className="bg-gold text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition"
            >
              Upgrade to Premium
            </button>
          </div>
        )}

        {recipes.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-6">Recent Recipes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        )}

        <SavedRecipesHero />

        <div className="mb-8">
          <div id='mysavedrecipies' className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">My Saved Recipes</h2>
            {savedRecipes.length > 0 && (
              <button className="flex items-center text-primary hover:text-gold transition-colors duration-200">
                <Search className="w-5 h-5 mr-1" />
                <span>Find Recipe</span>
              </button>
            )}
          </div>

          {savedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center border border-primary/10">
              <h3 className="text-xl font-bold text-primary mb-2">No Saved Recipes Yet</h3>
              <p className="text-gray-700 mb-4">
                {isSubscribed
                  ? "You haven't saved any recipes yet. Generate some recipes and save your favorites!"
                  : "Upgrade to premium to save your favorite recipes."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

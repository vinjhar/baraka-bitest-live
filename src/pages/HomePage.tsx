import React, { useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import FeatureCard from '../components/FeatureCard';
import RecipeGenerator from '../components/RecipeGenerator';
import RecipeCard from '../components/RecipeCard';
import PricingCard from '../components/PricingCard';
import { useRecipes } from '../contexts/RecipeContext';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { Utensils, Database, BookMarked, Medal, Search, Clock } from 'lucide-react';

const HomePage: React.FC = () => {
  const { recipes } = useRecipes();
  
  useEffect(() => {
    document.title = 'Baraka Bites - Halal Recipe AI Platform';
  }, []);

  return (
    <div className="bg-cream">
      <HeroSection />
      
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Generate Your <span className="text-gold">Halal Recipe</span>
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Enter your ingredients below, and we'll generate a unique halal recipe using AI — grounded in tradition and mindful of your health, inshaAllah.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <RecipeGenerator />
          </div>
        </div>
      </section>
      
      {recipes.length > 0 && (
        <section className="py-16 bg-cream/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Generated <span className="text-gold">Recipes</span>
              </h2>
              <p className="text-gray-700 max-w-2xl mx-auto">
                Explore the delicious halal recipes created just for you.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </section>
      )}
      
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Why Choose <span className="text-gold">Baraka Bites</span>
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Discover the unique features that make our halal recipe platform special.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Utensils} 
              title="AI-Powered Recipes" 
              description="Our advanced AI creates personalized halal recipes based on the ingredients you have available."
            />
            <FeatureCard 
              icon={Database} 
              title="Sunnah Food Knowledge" 
              description="Learn about foods mentioned in Islamic traditions and their health benefits."
            />
            <FeatureCard 
              icon={BookMarked} 
              title="Save Your Favorites" 
              description="Premium members can save and organize their favorite recipes for easy access."
            />
            <FeatureCard 
              icon={Medal} 
              title="100% Halal Verified" 
              description="All recipes are carefully checked to ensure they conform to halal dietary guidelines."
            />
            <FeatureCard 
              icon={Search} 
              title="Ingredient Substitution" 
              description="Easily find halal alternatives for any non-halal ingredients in traditional recipes."
            />
            <FeatureCard 
              icon={Clock} 
              title="Quick & Easy Recipes" 
              description="Find recipes that fit your schedule, from 15-minute meals to slow-cooked delights."
            />
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-cream/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Choose Your <span className="text-gold">Plan</span>
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Select the plan that best fits your cooking needs and budget.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard 
              title={STRIPE_PRODUCTS.FREE.name}
              price="£0"
              description={STRIPE_PRODUCTS.FREE.description}
              features={[
                "3 recipe generations total",
                "Access to basic recipes",
                "Halal ingredient verification",
                "Email support"
              ]}
              priceId={STRIPE_PRODUCTS.FREE.priceId}
              mode={STRIPE_PRODUCTS.FREE.mode}
            />
            <PricingCard 
              title={STRIPE_PRODUCTS.PREMIUM.name}
              price="£4.99"
              description={STRIPE_PRODUCTS.PREMIUM.description}
              features={[
                "Unlimited recipe generations",
                "Save favorite recipes",
                "Advanced cooking techniques",
                "Priority support",
                "Downloadable du'a PDF book",
                "10% of proceeds donated to charity"
              ]}
              priceId={STRIPE_PRODUCTS.PREMIUM.priceId}
              mode={STRIPE_PRODUCTS.PREMIUM.mode}
              isHighlighted={true}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
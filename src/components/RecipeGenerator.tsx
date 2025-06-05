import { useState, useRef, useEffect } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
type RecipeGeneratorProps = {
  upadteGenerationLeft: () => void;
};

const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ upadteGenerationLeft }) => {
  const [ingredients, setIngredients] = useState('');
  const [mealType, setMealType] = useState('Main Meals');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | JSX.Element>('');
  const { generateRecipe, recipes } = useRecipes();
  const { isAuthenticated, hasReachedLimit, incrementRecipeCount } = useAuth();
  const lastRecipeRef = useRef<HTMLDivElement>(null);

  // Scroll to the latest recipe whenever recipes array changes
  useEffect(() => {
    if (recipes.length > 0) {
      lastRecipeRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [recipes]);

  const handleIngredientsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIngredients(e.target.value);
  };

  const handleMealTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMealType(e.target.value);
  };




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ingredients.trim()) {
      setError('Please enter at least one ingredient');
      return;
    }

    if (!isAuthenticated) {
      setError('Please sign in to generate recipes');
      return;
    }

    if (hasReachedLimit) {
      setError(
        <span>
          You've reached your limit.{' '}
          <Link to="/pricing" className="text-primary hover:text-gold underline">
            Upgrade to premium
          </Link>{' '}
          for unlimited recipes.
        </span>
      );
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const ingredientList = ingredients.split(',').map(ing => ing.trim()).filter(ing => ing !== '');
      await generateRecipe(ingredientList, mealType,);
      await upadteGenerationLeft()
      incrementRecipeCount();
      setIngredients('');
      window.location.reload()
    } catch (err) {
      setError('Failed to generate recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 border border-primary/10 hover-lift">
      <div className="flex items-center mb-6">
        <Sparkles className="w-6 h-6 text-gold mr-2" />
        <h2 className="text-2xl font-bold text-primary">Generate Halal Recipe</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="ingredients" className="block text-gray-700 font-medium mb-2">
            Ingredients (comma separated)
          </label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={handleIngredientsChange}
            placeholder="e.g., chicken, rice, onion, olive oil"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow duration-200"
            rows={3}
          ></textarea>
        </div>

        <div>
          <label htmlFor="mealType" className="block text-gray-700 font-medium mb-2">
            Meal Type
          </label>
          <select
            id="mealType"
            value={mealType}
            onChange={handleMealTypeChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow duration-200"
          >
            <option value="Suhoor (Pre-Dawn)">Suhoor (Pre-Dawn)</option>
            <option value="Iftar (Post-Sunset)">Iftar (Post-Sunset)</option>
            <option value="Light Meals">Light Meals</option>
            <option value="Main Meals">Main Meals</option>
            <option value="Healthy Snacks">Healthy Snacks</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md animate-fade-in">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isAuthenticated || hasReachedLimit}
          className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center
            ${isLoading || !isAuthenticated || hasReachedLimit
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90 hover-lift'} 
            transition-all duration-200`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Recipe...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Bismillah — Generate My Recipe
            </>
          )}
        </button>

        {!isAuthenticated && (
          <p className="mt-3 text-sm text-center text-gray-500 animate-fade-in">
            Please sign in to generate recipes
          </p>
        )}

        {hasReachedLimit && (
          <p className="mt-3 text-sm text-center text-gray-500 animate-fade-in">
            You've reached your limit.{' '}
            <Link to="/pricing" className="text-primary hover:text-gold underline">
              Upgrade to premium
            </Link>{' '}
            for unlimited recipes.
          </p>
        )}
      </form>

      {/* This div will be used to scroll to the latest recipe */}
      <div ref={lastRecipeRef} />
    </div>
  );
};

export default RecipeGenerator;
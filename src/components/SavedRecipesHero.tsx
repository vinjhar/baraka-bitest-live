import React from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { BookOpen } from 'lucide-react';

const SavedRecipesHero: React.FC = () => {
  const { savedRecipes } = useRecipes();

  return (
    <div className="bg-primary/10 p-6 rounded-lg mb-8">
      <div className="flex items-center space-x-4">
        <div className="bg-primary rounded-full p-3">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Your Saved Recipes</h2>
          <p className="text-gray-600">
            {savedRecipes.length === 0 
              ? "You haven't saved any recipes yet. Start exploring and save your favorites!" 
              : `You have ${savedRecipes.length} saved recipe${savedRecipes.length === 1 ? '' : 's'}`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default SavedRecipesHero;
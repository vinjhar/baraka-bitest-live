import React, { createContext, useState, useContext, useEffect } from 'react';
import { generateHalalRecipe } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Recipe = {
  user_id: any;
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  imageUrl?: string;
  isSaved: boolean;
};

type RecipeContextType = {
  recipes: Recipe[];
  savedRecipes: Recipe[];
  isLoading: boolean;
  generateRecipe: (ingredients: string[], mealType: string) => Promise<Recipe>;
  saveRecipe: (recipeId: string) => Promise<void>;
  removeRecipe: (recipeId: string) => Promise<void>;
};

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const RECIPES_STORAGE_KEY = 'baraka-recipes';

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch recipes from Supabase for the logged-in user
  const fetchRecipes = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching recipes:', error);
        setRecipes([]);
        return;
      }

      setRecipes(data || []);

      // Save to localStorage after fetch
      try {
        localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(data || []));
      } catch (err) {
        console.error('Error saving recipes to storage:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchRecipes();
      loadSavedRecipes();
    } else {
      setRecipes([]);
      setSavedRecipes([]);
      localStorage.removeItem(RECIPES_STORAGE_KEY);
    }
  }, [isAuthenticated, user?.id]);

  // Sync recipes to localStorage when recipes state changes
  useEffect(() => {
    try {
      localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
    } catch (error) {
      console.error('Error saving recipes to storage:', error);
    }
  }, [recipes]);

  const loadSavedRecipes = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loadedRecipes = data.map(recipe => ({
        ...recipe,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        isSaved: true,
      }));

      setSavedRecipes(loadedRecipes);

      setRecipes(prev =>
        prev.map(recipe => ({
          ...recipe,
          isSaved: loadedRecipes.some(saved => saved.id === recipe.id),
        }))
      );
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipeToDatabase = async (recipeData: any) => {
    try {
      const { error } = await supabase.from('saved_recipes').insert([recipeData]);
      if (error) console.error('Error saving recipe:', error);
    } catch (error) {
      console.error('Trycatch:Error saving recipe:', error);
    }
  };

  const generateRecipe = async (ingredients: string[], mealType: string): Promise<Recipe> => {
    try {
      setIsLoading(true);

      const generatedRecipe = await generateHalalRecipe(
        ingredients,
        mealType,
        user?.id,
        user?.isPremium
      );

      const newRecipe: Recipe = {
        user_id: user?.id,
        id: `recipe-${Date.now()}`,
        ...generatedRecipe,
        isSaved: false,
      };

      const dattosend = {
        user_id: user?.id,
        title: newRecipe.title,
        description: newRecipe.description,
        ingredients: newRecipe.ingredients,
        instructions: newRecipe.instructions,
        prep_time: newRecipe.prepTime,
        cook_time: newRecipe.cookTime,
      };

      // Save recipe to database
      await saveRecipeToDatabase(dattosend);

      // After saving, refresh the recipes from DB to get the updated list including new recipe
      await fetchRecipes();

      // Return the newly generated recipe
      return newRecipe;
    } catch (error) {
      console.error('Error in generateRecipe:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipe = async (recipeId: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;

      const { error } = await supabase
        .from('saved_recipes')
        .upsert(
          [
            {
              id: recipe.id,
              user_id: user.id,
              title: recipe.title,
              description: recipe.description,
              ingredients: recipe.ingredients,
              instructions: recipe.instructions,
              prep_time: recipe.prepTime,
              cook_time: recipe.cookTime,
            },
          ],
          {
            onConflict: 'id,user_id',
          }
        );

      if (error) throw error;

      const updatedRecipe = { ...recipe, isSaved: true };

      setRecipes(prev => prev.map(r => (r.id === recipeId ? updatedRecipe : r)));

      setSavedRecipes(prev => {
        const exists = prev.some(r => r.id === recipeId);
        return exists ? prev : [updatedRecipe, ...prev];
      });
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeRecipe = async (recipeId: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user.id);

      if (error) throw error;

      setRecipes(prev =>
        prev.map(recipe => (recipe.id === recipeId ? { ...recipe, isSaved: false } : recipe))
      );

      setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    } catch (error) {
      console.error('Error removing recipe:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        savedRecipes,
        isLoading,
        generateRecipe,
        saveRecipe,
        removeRecipe,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = (): RecipeContextType => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};

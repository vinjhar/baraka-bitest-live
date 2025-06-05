import OpenAI from 'openai';
import { supabase } from './supabase';

// Validate environment variables
const REQUIRED_ENV_VARS = {
  VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Check all required environment variables
Object.entries(REQUIRED_ENV_VARS).forEach(([key, value]) => {
  if (!value) {
    throw new Error(
      `${key} is not defined in environment variables. ` +
      'Please check your .env file and ensure all required variables are set:\n\n' +
      Object.keys(REQUIRED_ENV_VARS).map(k => `${k}=your_${k.toLowerCase()}`).join('\n')
    );
  }
});

const openai = new OpenAI({
  apiKey: REQUIRED_ENV_VARS.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const HARAM_INGREDIENTS = [
  'pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer', 'lard', 'gelatin',
  'pepsin', 'rennet', 'vanilla extract', 'rum', 'brandy', 'sherry',
  'cooking wine', 'mirin', 'sake', 'blood', 'carnivorous animal meat',
  'pig derivatives', 'ethanol', 'liquor', 'spirits'
];

// Generate a hash for recipe comparison
function generateRecipeHash(ingredients: string[], mealType: string): string {
  const normalized = ingredients
    .map(i => i.toLowerCase().trim())
    .sort()
    .join('|') + '|' + mealType.toLowerCase();
    
  // Use a more browser-compatible hashing approach
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

async function checkRecipeDuplicate(userId: string, recipeHash: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('recipe_history')
      .select('id')
      .eq('user_id', userId)
      .eq('recipe_hash', recipeHash)
      .limit(1);

    if (error) {
      console.error('Error checking recipe duplicate:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in checkRecipeDuplicate:', error);
    return false;
  }
}

async function saveRecipeHistory(
  userId: string, 
  recipe: { title: string; ingredients: string[] }, 
  ingredients: string[], 
  mealType: string
) {
  try {
    const recipeHash = generateRecipeHash(ingredients, mealType);
    
    await supabase.from('recipe_history').insert({
      user_id: userId,
      recipe_hash: recipeHash,
      title: recipe.title,
      ingredients: recipe.ingredients,
      meal_type: mealType
    });
  } catch (error) {
    console.error('Error saving recipe history:', error);
  }
}

function validateIngredients(ingredients: string[]): string[] {
  return ingredients.filter(ing => {
    const lowerIng = ing.toLowerCase();
    return !HARAM_INGREDIENTS.some(haram => lowerIng.includes(haram.toLowerCase()));
  });
}

export async function generateHalalRecipe(
  ingredients: string[], 
  mealType: string,
  userId?: string,
  isPremium?: boolean
): Promise<{
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
}> {
  if (!ingredients?.length) {
    throw new Error('No ingredients provided');
  }

  const filteredIngredients = validateIngredients(ingredients);

  if (!filteredIngredients.length) {
    throw new Error('No valid halal ingredients provided');
  }

  let promptModifier = '';

  if (userId && isPremium) {
    try {
      const recipeHash = generateRecipeHash(filteredIngredients, mealType);
      const isDuplicate = await checkRecipeDuplicate(userId, recipeHash);
      
      if (isDuplicate) {
        promptModifier = ' (please provide a different variation than previously generated)';
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }
  }

  const prompt = `Create a 100% halal recipe using these ingredients: ${filteredIngredients.join(', ')}. 
    This should be a ${mealType}${promptModifier} recipe.
    
    CRITICAL REQUIREMENTS:
    - The recipe MUST be strictly halal
    - NO pork, alcohol, or any non-halal ingredients
    - If meat is used, assume it's already halal-certified (don't prefix with "halal")
    - NO cooking wine or alcohol-based extracts
    - Use halal substitutes for any non-halal ingredients
    - Create a unique variation if possible
    - Only mention "halal" for ingredients that specifically need clarification
    
    Format the response as a JSON object with the following structure:
    {
      "title": "Recipe name",
      "description": "Brief description",
      "ingredients": ["list", "of", "ingredients", "with", "measurements"],
      "instructions": ["Step 1", "Step 2", "etc"],
      "prepTime": "preparation time",
      "cookTime": "cooking time"
    }`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const recipe = JSON.parse(response);

    // Double-check for haram ingredients in the response
    const hasHaramIngredients = recipe.ingredients.some(ing => 
      HARAM_INGREDIENTS.some(haram => 
        ing.toLowerCase().includes(haram.toLowerCase())
      )
    );

    if (hasHaramIngredients) {
      throw new Error('Generated recipe contains non-halal ingredients');
    }

    // Save to history for premium users
    if (userId && isPremium) {
      await saveRecipeHistory(userId, recipe, filteredIngredients, mealType);
    }

    return recipe;
  } catch (error: any) {
    console.error('Error generating recipe:', error);
    throw new Error(error.message || 'Failed to generate recipe');
  }
}
// RecipeCard.tsx
import React, { useState } from 'react';
import {
  ChevronDown, Clock, BookmarkPlus, BookmarkCheck, Share2, Leaf, Brain, Loader2, X,
  MessageCircle, Facebook, Twitter, Mail, Copy
} from 'lucide-react';
import { Recipe } from '../contexts/RecipeContext';
import { useAuth } from '../contexts/AuthContext';
import { useRecipes } from '../contexts/RecipeContext';
import { supabase } from '../lib/supabase';

const SUNNAH_INGREDIENTS = [
  'dates', 'honey', 'barley', 'cucumber', 'watermelon', 'black seed',
  'milk', 'figs', 'pomegranate', 'olives', 'olive oil', 'vinegar',
  'grapes', 'fish', 'pumpkin', 'gourd', 'meat', 'talbina'
];

const MINDFUL_TIPS = [
  'Pause and reflect before you eat.',
  'Try eating with your right hand.',
  'Sharing meals strengthens family bonds.',
  'Sitting while eating supports digestion.',
  "Don't waste food — even a few grains matter.",
  "Eat in moderation — stop before you're completely full."
];

type RecipeCardProps = {
  recipe: Recipe;
};

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { saveRecipe, removeRecipe, isLoading } = useRecipes();

  const recipeText = `🍽️ *${recipe.title}*\n\n📝 *Description:*\n${recipe.description}\n\n🥘 *Ingredients:*\n${recipe.ingredients.map(i => `• ${i}`).join('\n')}\n\n👩‍🍳 *Instructions:*\n${recipe.instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n⏱️ Prep Time: ${recipe.prepTime}\n⏰ Cook Time: ${recipe.cookTime}\n\n_Generated with ❤️ by Baraka Bites_`;

  const handleSaveToggle = async () => {
    if (!isAuthenticated || !user?.isPremium || isSaving || isLoading) return;

    try {
      setIsSaving(true);
      if (recipe.isSaved) {
        await removeRecipe(recipe.id);
      } else {
        await saveRecipe(recipe.id);
      }
    } catch (error) {
      console.error('Error toggling recipe save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const shareViaWebShare = async () => {
    if (!navigator.share) return false;

    try {
      await navigator.share({
        title: recipe.title,
        text: recipeText,
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const shareViaWhatsApp = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappUrl = isMobile
      ? `whatsapp://send?text=${encodeURIComponent(recipeText)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(recipeText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const shareViaFacebook = () => {
    const urlToShare = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToShare)}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const shareViaTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(recipeText)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this recipe: ${recipe.title}`);
    const body = encodeURIComponent(`${recipeText}\n\nLink: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recipeText);
      alert('Recipe copied to clipboard! You can now paste it anywhere.');
    } catch (err) {
      alert('Failed to copy. Please try manually.');
    }
  };



  const handleShareOption = (option: string) => {
    setShareMenuOpen(false);
    setIsSharing(true);

    if (option === 'whatsapp') {
      shareViaWhatsApp();
    } else if (option === 'facebook') {
      shareViaFacebook();
    } else if (option === 'twitter') {
      shareViaTwitter();
    } else if (option === 'email') {
      const subject = encodeURIComponent(`Check out this recipe: ${recipe.title}`);
      const body = encodeURIComponent(`${recipeText}\n\nLink: ${window.location.href}`);
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailtoUrl, '_blank');
    } else if (option === 'copy') {
      navigator.clipboard.writeText(recipeText)
        .then(() => {
          alert('Recipe copied to clipboard! You can now paste it anywhere.');
        })
        .catch(() => {
          alert('Failed to copy. Please try manually.');
        });
    }

    setIsSharing(false);
  };



  const sunnahIngredients = recipe.ingredients.filter(ingredient =>
    SUNNAH_INGREDIENTS.some(sunnah =>
      ingredient.toLowerCase().includes(sunnah.toLowerCase())
    )
  );

  const randomTip = MINDFUL_TIPS[Math.floor(Math.random() * MINDFUL_TIPS.length)];

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-primary/10 transition-all duration-300 hover:shadow-xl">
        <div className="p-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            100% Halal Assured – No pork, alcohol, or haram content
          </div>

          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-primary">{recipe.title}</h3>
            <div className="flex gap-2 relative">
              <button
                onClick={() => setShareMenuOpen(prev => !prev)}
                disabled={isSharing}
                className={`bg-primary/5 p-2 rounded-full hover:bg-primary/10 transition-all duration-200 hover:scale-105 ${shareMenuOpen ? 'ring-2 ring-primary' : ''}`}
                title="Share recipe"
              >
                {isSharing ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Share2 className="w-5 h-5 text-primary" />
                )}
              </button>

              {shareMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-2 space-y-1">
                  {/* <button onClick={() => handleShareOption('web-share')} className="flex items-center gap-2 w-full text-left px-3 py-1.5 hover:bg-primary/10 rounded-md">
                    <Share2 className="w-5 h-5 text-primary" /> Web Share
                  </button> */}
                  <button onClick={() => handleShareOption('whatsapp')} className="flex items-center gap-2 w-full text-left px-3 py-1.5 hover:bg-primary/10 rounded-md">
                    <MessageCircle className="w-5 h-5 text-green-500" /> WhatsApp
                  </button>
                  <button onClick={() => handleShareOption('facebook')} className="flex items-center gap-2 w-full text-left px-3 py-1.5 hover:bg-primary/10 rounded-md">
                    <Facebook className="w-5 h-5 text-blue-600" /> Facebook
                  </button>
                  <button onClick={() => handleShareOption('twitter')} className="flex items-center gap-2 w-full text-left px-3 py-1.5 hover:bg-primary/10 rounded-md">
                    <Twitter className="w-5 h-5 text-sky-400" /> Twitter
                  </button>
                  <button onClick={() => handleShareOption('email')} className="flex items-center gap-2 w-full text-left px-3 py-1.5 hover:bg-primary/10 rounded-md">
                    <Mail className="w-5 h-5 text-red-600" /> Email
                  </button>
                  <button onClick={() => handleShareOption('copy')} className="flex items-center gap-2 w-full text-left px-3 py-1.5 hover:bg-primary/10 rounded-md">
                    <Copy className="w-5 h-5 text-gray-600" /> Copy to Clipboard
                  </button>
                </div>
              )}

              {isAuthenticated && user?.isPremium && (
                <button
                  onClick={handleSaveToggle}
                  disabled={isSaving || isLoading}
                  className="bg-primary/5 p-2 rounded-full hover:bg-primary/10 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  title={recipe.isSaved ? "Remove from saved" : "Save recipe"}
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : recipe.isSaved ? (
                    <BookmarkCheck className="w-5 h-5 text-gold" />
                  ) : (
                    <BookmarkPlus className="w-5 h-5 text-primary" />
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-gray-700 mb-4">{recipe.description}</p>

          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Clock className="w-4 h-4 mr-1" />
            <span>Prep: {recipe.prepTime}</span>
            <span className="mx-2">•</span>
            <Clock className="w-4 h-4 mr-1" />
            <span>Cook: {recipe.cookTime}</span>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Ingredients:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              {recipe.ingredients.map((ingredient, idx) => (
                <li
                  key={idx}
                  className={sunnahIngredients.includes(ingredient) ? 'font-bold text-primary' : ''}
                  title={sunnahIngredients.includes(ingredient) ? 'Sunnah Ingredient' : undefined}
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Mindful Eating Tip:</h4>
            <p className="italic text-primary">{randomTip}</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            View Recipe Details
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-full overflow-auto p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 transition-colors"
              title="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-primary mb-4">{recipe.title}</h2>
            <p className="mb-4">{recipe.description}</p>

            <h3 className="font-semibold mb-2">Ingredients:</h3>
            <ul className="list-disc list-inside mb-4">
              {recipe.ingredients.map((ingredient, idx) => (
                <li key={idx}>{ingredient}</li>
              ))}
            </ul>

            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              {recipe.instructions.map((instruction, idx) => (
                <li key={idx}>{instruction}</li>
              ))}
            </ol>

            <p className="text-sm text-gray-500 italic">Prep Time: {recipe.prepTime} | Cook Time: {recipe.cookTime}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default RecipeCard;

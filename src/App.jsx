import React, { useState, useEffect } from 'react';
import './index.css';

const App = () => {
  const [query, setQuery] = useState('');
  const [meal, setMeal] = useState(null);
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favorites')) || []);
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode')) || false);
  const [suggestionIngredients, setSuggestionIngredients] = useState('');
  const [suggestedMeals, setSuggestedMeals] = useState([]);
  const [mealType, setMealType] = useState('');
  const [nutritionFacts, setNutritionFacts] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const fetchNutritionFacts = async (mealName) => {
    try {
      const res = await fetch(`https://api.edamam.com/api/nutrition-data?app_id=demo&app_key=demo&ingr=${mealName}`);
      const data = await res.json();
      if (data.calories) {
        setNutritionFacts({
          calories: data.calories,
          fat: data.totalNutrients.FAT?.quantity,
          protein: data.totalNutrients.PROCNT?.quantity,
        });
      } else {
        setNutritionFacts(null);
      }
    } catch (err) {
      console.error('Nutrition fetch failed', err);
      setNutritionFacts(null);
    }
  };

  const suggestMealsByIngredients = async () => {
    if (!suggestionIngredients.trim()) return;
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${suggestionIngredients}`);
      const data = await res.json();
      let meals = data.meals || [];
      if (mealType && meals.length > 0) {
        const filterRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${mealType}`);
        const filterData = await filterRes.json();
        const filterIds = new Set((filterData.meals || []).map((m) => m.idMeal));
        meals = meals.filter((m) => filterIds.has(m.idMeal));
      }
      setSuggestedMeals(meals);
    } catch (err) {
      console.error('Suggestion Error:', err);
    } finally {
      setSuggestionIngredients('');
    }
  };

  const handleMealClickById = async (id) => {
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
      const data = await res.json();
      if (data.meals) {
        const myMeal = data.meals[0];
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = myMeal[`strIngredient${i}`];
          const measure = myMeal[`strMeasure${i}`];
          if (ingredient) ingredients.push(`${measure} ${ingredient}`);
        }
        setMeal({ ...myMeal, ingredients });
        fetchNutritionFacts(myMeal.strMeal);
        setError('');
        setShowInstructions(false);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Error fetching meal by ID:', err);
      setError('Failed to load meal details.');
    }
  };

  const searchMeals = async () => {
    if (!query.trim()) return;
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
      const data = await res.json();
      if (data.meals) {
        setSearchResults(data.meals);
      } else {
        setSearchResults([]);
        setError('No meals found');
      }
    } catch (err) {
      console.error('Search failed', err);
      setError('Failed to search meals');
    } finally {
      setQuery('');
    }
  };

  const toggleFavorite = (meal) => {
    const exists = favorites.find((fav) => fav.idMeal === meal.idMeal);
    if (exists) {
      setFavorites(favorites.filter((fav) => fav.idMeal !== meal.idMeal));
    } else {
      setFavorites([...favorites, meal]);
    }
  };

  const isFavorite = (id) => favorites.some((fav) => fav.idMeal === id);

  const resetState = () => {
    setSearchResults([]);
    setSuggestedMeals([]);
    setError('');
    setMeal(null);
    setShowModal(false);
    setShowInstructions(false);
  };

  return (
    <div
      className={`${
        darkMode
          ? 'dark bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100'
          : 'bg-gradient-to-br from-amber-50 via-orange-100 to-red-100 text-gray-900'
      } min-h-screen p-6 font-poppins antialiased transition-all duration-500`}
    >
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
        <div className="p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              🍽 Gourmet Meal Explorer
            </h1>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowFavorites(false)}
                className={`px-5 py-2.5 rounded-xl font-semibold ${
                  !showFavorites
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                } hover:scale-105 transition-transform duration-200`}
              >
                Home
              </button>
              <button
                onClick={() => setShowFavorites(true)}
                className={`px-5 py-2.5 rounded-xl font-semibold ${
                  showFavorites
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                } hover:scale-105 transition-transform duration-200`}
              >
                Favorites ({favorites.length})
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-200"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? '☀️ Light' : '🌙 Dark'} Mode
              </button>
            </div>
          </div>

          {!showFavorites && (
            <>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <input
                  type="text"
                  placeholder="Search for gourmet dishes..."
                  className="flex-1 px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      searchMeals();
                    }
                  }}
                />
                <button
                  onClick={searchMeals}
                  className="px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 shadow-lg shadow-orange-500/30 hover:scale-105 transition-all duration-200"
                >
                  Search
                </button>
                <button
                  onClick={resetState}
                  className="px-6 py-3 rounded-xl bg-gray-500 text-white font-semibold hover:bg-gray-600 shadow-lg shadow-gray-500/30 hover:scale-105 transition-all duration-200"
                >
                  Reset
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-gray-100">Search Results</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map((m) => (
                      <div
                        key={m.idMeal}
                        className="relative bg-white dark:bg-gray-700/80 backdrop-blur-sm p-5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in"
                      >
                        <img
                          src={m.strMealThumb}
                          alt={m.strMeal}
                          onClick={() => handleMealClickById(m.idMeal)}
                          className="rounded-lg w-full h-56 object-cover mb-3 cursor-pointer"
                        />
                        <p className="text-center font-medium text-lg text-gray-900 dark:text-gray-100">{m.strMeal}</p>
                        <button
                          onClick={() => toggleFavorite(m)}
                          className="absolute bottom-4 left-4 text-2xl hover:scale-110 transition-transform duration-200 text-red-500 dark:text-red-400"
                          title="Toggle Favorite"
                        >
                          {isFavorite(m.idMeal) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <input
                  type="text"
                  placeholder="Enter ingredients (e.g., chicken, truffle)"
                  className="flex-1 px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                  value={suggestionIngredients}
                  onChange={(e) => setSuggestionIngredients(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      suggestMealsByIngredients();
                    }
                  }}
                />
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                >
                  <option value="" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">All Categories</option>
                  <option value="Breakfast" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">Breakfast</option>
                  <option value="Vegetarian" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">Vegetarian</option>
                  <option value="Dessert" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">Dessert</option>
                </select>
                <button
                  onClick={suggestMealsByIngredients}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 shadow-lg shadow-purple-600/30 hover:scale-105 transition-all duration-200"
                >
                  Suggest
                </button>
              </div>

              {suggestedMeals.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-gray-100">Suggested Gourmet Meals</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestedMeals.map((m) => (
                      <div
                        key={m.idMeal}
                        className="relative bg-white dark:bg-gray-700/80 backdrop-blur-sm p-5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in"
                      >
                        <img
                          src={m.strMealThumb}
                          alt={m.strMeal}
                          onClick={() => handleMealClickById(m.idMeal)}
                          className="rounded-lg w-full h-56 object-cover mb-3 cursor-pointer"
                        />
                        <p className="text-center font-medium text-lg text-gray-900 dark:text-gray-100">{m.strMeal}</p>
                        <button
                          onClick={() => toggleFavorite(m)}
                          className="absolute bottom-4 left-4 text-2xl hover:scale-110 transition-transform duration-200 text-red-500 dark:text-red-400"
                          title="Toggle Favorite"
                        >
                          {isFavorite(m.idMeal) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {showFavorites && (
            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-gray-100">❤️ Your Favorite Dishes</h3>
              {favorites.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 text-lg">
                  No favorites yet. Discover and save your culinary treasures!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((m) => (
                    <div
                      key={m.idMeal}
                      className="relative bg-white dark:bg-gray-700/80 backdrop-blur-sm p-5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in"
                    >
                      <img
                        src={m.strMealThumb}
                        alt={m.strMeal}
                        onClick={() => handleMealClickById(m.idMeal)}
                        className="rounded-lg w-full h-56 object-cover mb-3 cursor-pointer"
                      />
                      <p className="text-center font-medium text-lg text-gray-900 dark:text-gray-100">{m.strMeal}</p>
                      <button
                        onClick={() => toggleFavorite(m)}
                        className="absolute bottom-4 left-4 text-2xl hover:scale-110 transition-transform duration-200 text-red-500 dark:text-red-400"
                        title="Remove from Favorites"
                      >
                        ❤️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-500 dark:text-red-400 mb-6 text-center font-medium text-lg animate-pulse">
              {error}
            </p>
          )}

          {showModal && meal && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-10 animate-fade-in">
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg text-gray-900 dark:text-gray-100 rounded-3xl shadow-2xl max-w-2xl w-full p-8 my-10 max-h-[calc(100vh-5rem)] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 scale-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-6 left-6 px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all duration-200"
                >
                  Back
                </button>
                <img
                  src={meal.strMealThumb}
                  alt={meal.strMeal}
                  className="w-full rounded-2xl mb-6 shadow-md"
                />
                <h2 className="text-3xl font-extrabold mb-3 tracking-tight text-gray-900 dark:text-gray-100">{meal.strMeal}</h2>
                <p className="text-sm italic mb-4 text-gray-600 dark:text-gray-400">Origin: {meal.strArea}</p>
                {nutritionFacts && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                      Nutrition Facts (approx.)
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-400">
                      <li>Calories: {Math.round(nutritionFacts.calories)}</li>
                      {nutritionFacts.fat && (
                        <li>Fat: {Math.round(nutritionFacts.fat)}g</li>
                      )}
                      {nutritionFacts.protein && (
                        <li>Protein: {Math.round(nutritionFacts.protein)}g</li>
                      )}
                    </ul>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2 tracking-tight text-gray-900 dark:text-gray-100">Ingredients</h3>
                <ul className="list-disc list-inside mb-6 text-gray-700 dark:text-gray-400">
                  {meal.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-400">{ing}</li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="mb-4 px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/30 hover:scale-105 transition-all duration-200"
                >
                  {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                </button>
                {showInstructions && (
                  <pre className="bg-gray-100 dark:bg-gray-800/80 p-5 rounded-xl whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-400 shadow-inner">
                    {meal.strInstructions}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
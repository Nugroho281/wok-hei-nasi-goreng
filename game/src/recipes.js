// The ingredients and the six recipes of the night market. Every recipe is a set of
// ingredient ids; the wok only accepts a tray whose contents match one recipe exactly, so
// the player must plan which ingredients to chop and carry. `chop` marks ingredients that
// need the chopping board before they can go in the wok.
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', chop: false, color: '#f3ead3', accent: '#d9c48f', shape: 'rice' },
  { id: 'mie', name: 'Mie', key: '2', chop: false, color: '#f0c75e', accent: '#c98f2d', shape: 'noodle' },
  { id: 'telur', name: 'Telur', key: '3', chop: false, color: '#f7f3e8', accent: '#e8a33d', shape: 'egg' },
  { id: 'ayam', name: 'Ayam', key: '4', chop: true, color: '#e8a87c', accent: '#b85c38', shape: 'meat' },
  { id: 'udang', name: 'Udang', key: '5', chop: true, color: '#f08a6d', accent: '#c94f3d', shape: 'shrimp' },
  { id: 'sayur', name: 'Sayur', key: '6', chop: true, color: '#7bc96f', accent: '#3d8b4f', shape: 'leaf' },
  { id: 'cabai', name: 'Cabai', key: '7', chop: true, color: '#d33a2c', accent: '#8f1d12', shape: 'chili' },
  { id: 'pete', name: 'Pete', key: '8', chop: true, color: '#8fae4d', accent: '#5d7a2e', shape: 'bean' },
  { id: 'kecap', name: 'Kecap', key: '9', chop: false, color: '#5b3a24', accent: '#2e1c10', shape: 'sauce' },
];

export const INGREDIENT_BY_ID = {};
for (const ingredient of INGREDIENTS) INGREDIENT_BY_ID[ingredient.id] = ingredient;

/**
 * The six recipes. `dish` is the plated dish's mound colour; `needs` lists ingredient ids
 * (one of each). A tray matches a recipe when it holds exactly these ids, in any order.
 */
export const RECIPES = [
  {
    id: 'biasa',
    name: 'Nasi Goreng Biasa',
    short: 'Biasa',
    needs: ['nasi', 'telur', 'sayur', 'kecap'],
    dish: '#c98f4e',
    price: 100,
  },
  {
    id: 'ayam',
    name: 'Nasi Goreng Ayam',
    short: 'Ayam',
    needs: ['nasi', 'ayam', 'telur', 'kecap'],
    dish: '#d9a05b',
    price: 120,
  },
  {
    id: 'seafood',
    name: 'Nasi Goreng Seafood',
    short: 'Seafood',
    needs: ['nasi', 'udang', 'telur', 'cabai'],
    dish: '#e0785a',
    price: 140,
  },
  {
    id: 'pete',
    name: 'Nasi Goreng Pete',
    short: 'Pete',
    needs: ['nasi', 'pete', 'ayam', 'cabai'],
    dish: '#a8a04e',
    price: 150,
  },
  {
    id: 'mie',
    name: 'Mie Goreng',
    short: 'Mie Goreng',
    needs: ['mie', 'ayam', 'sayur', 'kecap'],
    dish: '#e0b13e',
    price: 130,
  },
  {
    id: 'dadar',
    name: 'Telur Dadar Gulung',
    short: 'Dadar',
    needs: ['telur', 'sayur', 'cabai'],
    dish: '#f2c94c',
    price: 110,
  },
];

export const RECIPE_BY_ID = {};
for (const recipe of RECIPES) RECIPE_BY_ID[recipe.id] = recipe;

/** The recipe a tray's contents match, or null when no recipe matches exactly. */
export function matchRecipe(trayIds) {
  const sorted = [...trayIds].sort();
  for (const recipe of RECIPES) {
    const needs = [...recipe.needs].sort();
    if (sorted.length === needs.length && sorted.every((id, i) => id === needs[i])) return recipe;
  }
  return null;
}

/** True when the tray's contents are a subset of some recipe (still on the way there). */
export function isPartialMatch(trayIds) {
  for (const recipe of RECIPES) {
    if (trayIds.every((id) => recipe.needs.includes(id)) && trayIds.length < recipe.needs.length) return true;
  }
  return false;
}

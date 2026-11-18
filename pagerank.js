/* =============================================
   PAGERANK ENGINE
   Implements the iterative PageRank algorithm
   with a simulated link graph for the 6 mini-web pages.
   ============================================= */

const PAGES = [
  {
    id: 'pizza-pizza-pizza',
    url: 'http://pizza-pizza-pizza.com/',
    title: 'Pizza Pizza Pizza',
    desc: 'The ultimate pizza destination. Tons of pizza recipes, pizza deals, pizza toppings and everything about pizza pizza pizza!',
    keywords: ['pizza', 'pizza pizza', 'toppings', 'deals', 'cheese', 'crust', 'pepperoni'],
  },
  {
    id: 'cheap-eats-pune',
    url: 'http://cheap-eats-pune.com/',
    title: 'Cheap Eats Pune',
    desc: 'Find the best cheap eats in Pune. Affordable food options, budget restaurants, street food and canteen meals in Pune city.',
    keywords: ['cheap eats', 'pune', 'budget food', 'affordable', 'street food', 'restaurants', 'canteen'],
  },
  {
    id: 'pizza-recipes-home',
    url: 'https://pizza-recipes-home.com/',
    title: 'Pizza Recipes Home',
    desc: 'Home-made pizza recipes for every occasion. Easy dough, sauce recipes, and topping combinations for the perfect homemade pizza.',
    keywords: ['pizza recipes', 'homemade pizza', 'dough', 'sauce', 'toppings', 'recipe', 'bake'],
  },
  {
    id: 'pune-food-guide',
    url: 'https://pune-food-guide.com/',
    title: 'Pune Food Guide',
    desc: 'Your complete guide to food in Pune. Restaurants, cafes, street food, food reviews and culinary events in Pune.',
    keywords: ['pune food', 'restaurants', 'guide', 'cafes', 'reviews', 'culinary', 'street food', 'pune'],
  },
  {
    id: 'best-pizza-pune',
    url: 'http://best-pizza-pune.com/',
    title: 'Best Pizza in Pune',
    desc: 'Discover the best pizza places in Pune. Reviews, ratings, and rankings of Pune\'s top pizza restaurants and delivery.',
    keywords: ['best pizza', 'pune', 'pizza restaurant', 'delivery', 'ratings', 'reviews'],
  },
  {
    id: 'college-canteen-blog',
    url: 'https://college-canteen-blog.com/',
    title: 'College Canteen Blog',
    desc: 'A blog about college canteen food experiences across India. Budget meals, canteen reviews, cheap eats and student food hacks.',
    keywords: ['college canteen', 'blog', 'budget meals', 'student food', 'canteen reviews', 'cheap', 'india'],
  },
];

/*
  SIMULATED LINK GRAPH (who links to whom)
  Based on logical topical connections between the 6 pages.

  Format: links[fromId] = [toId, toId, ...]
*/
const LINK_GRAPH = {
  'pizza-pizza-pizza':   ['pizza-recipes-home', 'best-pizza-pune'],
  'cheap-eats-pune':     ['pune-food-guide', 'college-canteen-blog', 'best-pizza-pune'],
  'pizza-recipes-home':  ['pizza-pizza-pizza', 'best-pizza-pune'],
  'pune-food-guide':     ['cheap-eats-pune', 'best-pizza-pune', 'college-canteen-blog'],
  'best-pizza-pune':     ['pune-food-guide', 'pizza-pizza-pizza'],
  'college-canteen-blog':['cheap-eats-pune', 'pune-food-guide'],
};

/*
  PAGERANK COMPUTATION
  Standard iterative algorithm with damping factor d = 0.85
  Runs for N iterations until convergence.
*/
function computePageRank(pages, linkGraph, dampingFactor = 0.85, iterations = 100) {
  const N = pages.length;
  const ids = pages.map(p => p.id);

  // Initialize all PR values equally
  let pr = {};
  ids.forEach(id => pr[id] = 1 / N);

  // Build incoming links index
  const incomingLinks = {};
  ids.forEach(id => incomingLinks[id] = []);
  ids.forEach(from => {
    (linkGraph[from] || []).forEach(to => {
      incomingLinks[to].push(from);
    });
  });

  // Iterative computation
  for (let iter = 0; iter < iterations; iter++) {
    const newPr = {};
    ids.forEach(id => {
      let rank = (1 - dampingFactor) / N;
      incomingLinks[id].forEach(inId => {
        const outLinks = (linkGraph[inId] || []).length || 1;
        rank += dampingFactor * (pr[inId] / outLinks);
      });
      newPr[id] = rank;
    });
    pr = newPr;
  }

  return pr;
}

/*
  OLD WAY — Keyword Frequency Scoring
  Scores a page by counting keyword overlaps with the query.
  Also gives bonus for keyword in URL and title.
*/
function computeOldRanking(pages, query) {
  const q = query.toLowerCase().split(/\s+/).filter(Boolean);

  return pages.map(page => {
    let score = 0;
    const titleLower = page.title.toLowerCase();
    const descLower  = page.desc.toLowerCase();
    const urlLower   = page.url.toLowerCase();

    q.forEach(word => {
      // Count in title (high weight)
      const titleMatches = (titleLower.match(new RegExp(word, 'g')) || []).length;
      score += titleMatches * 3;

      // Count in URL
      if (urlLower.includes(word)) score += 2;

      // Count in description
      const descMatches = (descLower.match(new RegExp(word, 'g')) || []).length;
      score += descMatches * 1;

      // Keyword list match (simulates meta keywords tag)
      page.keywords.forEach(kw => {
        if (kw.toLowerCase().includes(word)) score += 2;
      });
    });

    return { ...page, score };
  }).sort((a, b) => b.score - a.score);
}

/*
  NEW WAY — PageRank + Relevance
  Combines pre-computed PageRank with a relevance multiplier.
*/
const PAGE_RANKS = computePageRank(PAGES, LINK_GRAPH);

function computePageRankRanking(pages, query) {
  const q = query.toLowerCase().split(/\s+/).filter(Boolean);

  return pages.map(page => {
    let relevance = 0;
    const titleLower = page.title.toLowerCase();
    const descLower  = page.desc.toLowerCase();

    q.forEach(word => {
      if (titleLower.includes(word)) relevance += 1;
      if (descLower.includes(word))  relevance += 0.5;
    });

    // If not relevant at all, still show but with very low score
    const relevanceFactor = relevance > 0 ? (1 + relevance * 0.3) : 0.1;
    const score = PAGE_RANKS[page.id] * relevanceFactor;

    return { ...page, score, pageRank: PAGE_RANKS[page.id] };
  }).sort((a, b) => b.score - a.score);
}

// Export
window.PAGES = PAGES;
window.LINK_GRAPH = LINK_GRAPH;
window.PAGE_RANKS = PAGE_RANKS;
window.computeOldRanking = computeOldRanking;
window.computePageRankRanking = computePageRankRanking;

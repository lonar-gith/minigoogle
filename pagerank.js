/* =============================================
   PAGERANK ENGINE — PIZZAGOOGLE
   6 Pune food sites with realistic link graph.
   pizza-pizza-pizza.com = keyword spammer (wins OLD, loses PageRank)
   best-pizza-pune.com   = authority (wins PageRank)
   ============================================= */

const PAGES = [
  {
    id: 'pizza-pizza-pizza',
    url: 'http://pizza-pizza-pizza.com/',
    title: 'Pizza Pizza Pizza',
    desc: 'Pizza pizza pizza! Best pizza pizza pizza toppings. Pizza pizza pizza crust. Pizza pizza cheese. Pizza pizza deal! Pizza pizza pizza lovers, this is the ultimate pizza pizza pizza destination. Pizza pizza pizza every day, every meal—pizza pizza pizza is life! Get pizza pizza pizza now!',
    keywords: ['pizza','pizza pizza','pizza pizza pizza','pizza toppings','pizza crust','pizza cheese','pizza deal','best pizza'],
    mascotEmoji: '🦝',
    mascotBg:    'linear-gradient(135deg,#E5E7EB,#D1D5DB)',
    mascotName:  'Sneaky Raccoon',
    mascotLabel: 'The Keyword Spammer 🚨',
    siteNum: 1,
  },
  {
    id: 'cheap-eats-pune',
    url: 'http://cheap-eats-pune.com/',
    title: 'Cheap Eats Pune',
    desc: 'Find the best cheap eats in Pune! Affordable food options, budget restaurants, street food stalls, vada pav corners, and canteen meals for college students in Pune city.',
    keywords: ['cheap eats','pune','budget food','affordable','street food','restaurants','canteen','vada pav','chai'],
    mascotEmoji: '🧓',
    mascotBg:    'linear-gradient(135deg,#FEF3C7,#FDE68A)',
    mascotName:  'Bargain Bhaiya',
    mascotLabel: 'Budget Food Expert 💰',
    siteNum: 2,
  },
  {
    id: 'pizza-recipes-home',
    url: 'https://pizza-recipes-home.com/',
    title: 'Pizza Recipes Home',
    desc: 'Homemade pizza recipes for every occasion! Easy dough and sauce recipes, topping combinations, baking tips for the perfect homemade pizza from your own kitchen.',
    keywords: ['pizza recipes','homemade pizza','dough','sauce','toppings','recipe','bake','rolling dough','oven'],
    mascotEmoji: '👵',
    mascotBg:    'linear-gradient(135deg,#FCE7F3,#FBCFE8)',
    mascotName:  'Nani Chef',
    mascotLabel: 'Home Recipe Queen 🫙',
    siteNum: 3,
  },
  {
    id: 'pune-food-guide',
    url: 'https://pune-food-guide.com/',
    title: 'Pune Food Guide',
    desc: 'Your complete guide to food in Pune! Best restaurants, cafes, street food, food reviews and culinary events across Pune city. Find cheap eats, canteen spots, and hidden food gems.',
    keywords: ['pune food','restaurants','guide','cafes','reviews','culinary','street food','pune','food'],
    mascotEmoji: '🐼',
    mascotBg:    'linear-gradient(135deg,#DBEAFE,#BFDBFE)',
    mascotName:  'Pune Panda',
    mascotLabel: 'City Food Guide 🗺️',
    siteNum: 4,
  },
  {
    id: 'best-pizza-pune',
    url: 'http://best-pizza-pune.com/',
    title: 'Best Pizza in Pune',
    desc: 'Discover the best pizza places in Pune! Expert reviews, star ratings, and rankings of Pune\'s top pizza restaurants and delivery joints. The definitive pizza authority for Pune foodies.',
    keywords: ['best pizza','pune','pizza restaurant','delivery','ratings','reviews','pizza pune','top pizza'],
    mascotEmoji: '🐱',
    mascotBg:    'linear-gradient(135deg,#FEF3C7,#FBBF24)',
    mascotName:  'Royal Chef Cat',
    mascotLabel: 'Pizza Authority 👑',
    siteNum: 5,
  },
  {
    id: 'college-canteen-blog',
    url: 'https://college-canteen-blog.com/',
    title: 'College Canteen Blog',
    desc: 'A blog about college canteen food experiences across Pune and India. Budget canteen meals, student food hacks, cheap eats, and canteen reviews for college life.',
    keywords: ['college canteen','blog','budget meals','student food','canteen reviews','cheap','india','pune','food'],
    mascotEmoji: '😴',
    mascotBg:    'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
    mascotName:  'Sleepy Student',
    mascotLabel: 'Campus Foodie 🏫',
    siteNum: 6,
  },
];

/*
  LINK GRAPH (directed: who links to whom)
  Designed so:
  - pizza-pizza-pizza.com gets few links (spammer; wins OLD, loses PageRank)
  - best-pizza-pune.com gets MOST links (authority; wins PageRank)
  - pune-food-guide.com is a hub (links many, receives many)
*/
const LINK_GRAPH = {
  'pizza-pizza-pizza':    ['pizza-recipes-home'],                                     // 1 outgoing, only 2 incoming
  'cheap-eats-pune':      ['pune-food-guide', 'college-canteen-blog', 'best-pizza-pune'], // 3 outgoing
  'pizza-recipes-home':   ['pizza-pizza-pizza', 'best-pizza-pune'],                   // 2 outgoing
  'pune-food-guide':      ['cheap-eats-pune', 'best-pizza-pune', 'college-canteen-blog'], // 3 outgoing, 3 incoming
  'best-pizza-pune':      ['pune-food-guide', 'pizza-pizza-pizza'],                   // 2 outgoing, 3 incoming
  'college-canteen-blog': ['cheap-eats-pune', 'pune-food-guide'],                     // 2 outgoing
};

/*  PageRank algorithm (iterative, damping factor configurable) */
function computePageRank(pages, linkGraph, dampingFactor = 0.85, iterations = 100) {
  const N   = pages.length;
  const ids = pages.map(p => p.id);

  let pr = {};
  ids.forEach(id => pr[id] = 1 / N);

  const inLinks = {};
  ids.forEach(id => inLinks[id] = []);
  ids.forEach(from => {
    (linkGraph[from] || []).forEach(to => inLinks[to].push(from));
  });

  for (let i = 0; i < iterations; i++) {
    const next = {};
    ids.forEach(id => {
      let rank = (1 - dampingFactor) / N;
      inLinks[id].forEach(inId => {
        const outCount = (linkGraph[inId] || []).length || 1;
        rank += dampingFactor * (pr[inId] / outCount);
      });
      next[id] = rank;
    });
    pr = next;
  }
  return pr;
}

/*  Old keyword-frequency scoring */
function computeOldRanking(pages, query) {
  const q = query === '*' ? [] : query.toLowerCase().split(/\s+/).filter(Boolean);
  return pages.map(page => {
    let score = 0;
    if (q.length === 0) {
      // star query: score by title length (all show)
      score = page.title.length;
    } else {
      const title = page.title.toLowerCase();
      const desc  = page.desc.toLowerCase();
      const url   = page.url.toLowerCase();
      q.forEach(word => {
        score += (title.match(new RegExp(word, 'g')) || []).length * 3;
        score += url.includes(word) ? 2 : 0;
        score += (desc.match(new RegExp(word, 'g')) || []).length * 1;
        page.keywords.forEach(kw => { if (kw.toLowerCase().includes(word)) score += 2; });
      });
    }
    return { ...page, score };
  }).sort((a, b) => b.score - a.score);
}

/*  PageRank + relevance combined scoring */
let PAGE_RANKS = computePageRank(PAGES, LINK_GRAPH, 0.85, 100);

function computePageRankRanking(pages, query, pr = PAGE_RANKS) {
  const q = query === '*' ? [] : query.toLowerCase().split(/\s+/).filter(Boolean);
  return pages.map(page => {
    let relevance = 0;
    if (q.length > 0) {
      const title = page.title.toLowerCase();
      const desc  = page.desc.toLowerCase();
      q.forEach(word => {
        if (title.includes(word)) relevance += 1;
        if (desc.includes(word))  relevance += 0.5;
      });
    } else {
      relevance = 1; // star = show all
    }
    const relevanceFactor = relevance > 0 ? (1 + relevance * 0.25) : 0.08;
    return { ...page, score: pr[page.id] * relevanceFactor, pageRank: pr[page.id] };
  }).sort((a, b) => b.score - a.score);
}

// Count keyword occurrences in full text (for display)
function countKeyword(page, query) {
  if (!query || query === '*') return 0;
  const q    = query.toLowerCase();
  const text = (page.title + ' ' + page.desc).toLowerCase();
  return (text.match(new RegExp(q.split(/\s+/)[0], 'g')) || []).length;
}

window.PAGES            = PAGES;
window.LINK_GRAPH       = LINK_GRAPH;
window.PAGE_RANKS       = PAGE_RANKS;
window.computePageRank  = computePageRank;
window.computeOldRanking       = computeOldRanking;
window.computePageRankRanking  = computePageRankRanking;
window.countKeyword            = countKeyword;

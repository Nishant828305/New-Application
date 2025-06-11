const API_KEY = "2d854b40f9c840bc888f96b704655528";
const url = "https://newsapi.org/v2/everything?q=";

const cards = document.getElementById("cards-container");
const template = document.getElementById("template-news-card");
const btn = document.getElementById("search-button");
const input = document.getElementById("search-text");
const langSelect = document.getElementById("language-select");
const themeToggle = document.getElementById("theme-toggle");
const micBtn = document.getElementById("mic-btn");

let activeNav = null;
let selectedLang = localStorage.getItem("language") || "en";

// === Nav item ===
const onNavItemClick = (category) => {
  getNews(category, selectedLang);
  if (activeNav) activeNav.classList.remove("active");
  activeNav = document.getElementById(category);
  activeNav.classList.add("active");
};

// === Utility functions ===
const getFromStorage = (key, fallback = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
const setToStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const show = (el, msg) => (el.innerHTML = `<div class="message">${msg}</div>`);

// === Page Load ===
window.addEventListener("load", () => {
  loadTheme();
  langSelect.value = selectedLang;
  getNews("Dhanbad", selectedLang);
  input.focus();
});

// === Fetch News ===
const getNews = async (query, lang = "en") => {
  show(cards, "Loading...");
  try {
    const res = await fetch(`${url}${encodeURIComponent(query)}&language=${lang}&apiKey=${API_KEY}`);
    const { articles } = await res.json();
    articles?.length ? renderNews(articles) : show(cards, "No articles found.");
  } catch (err) {
    console.error("Fetch error:", err);
    show(cards, "Failed to fetch news.");
  }
};

// === Render Cards ===
const renderNews = (articles) => {
  cards.innerHTML = "";
  articles.forEach((a) => {
    if (!a.urlToImage) return;
    const card = template.content.cloneNode(true);
    setCard(card, a);
    cards.appendChild(card);
  });
};

const isBookmarked = (url) => getFromStorage("bookmarks").some(b => b.url === url);

const setCard = (card, article) => {
  const { url, title, description, urlToImage, source, publishedAt } = article;

  card.querySelector("#news-img").src = urlToImage;
  card.querySelector("#news-title").textContent = title;
  card.querySelector("#news-desc").textContent = description;

  const date = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(publishedAt));

  card.querySelector("#news-source").textContent = `${source.name} · ${date}`;
  card.querySelector(".news-card").onclick = () => window.open(url, "_blank");

  const bookmarkBtn = card.querySelector(".bookmark-btn");
  updateBookmarkBtn(bookmarkBtn, article);

  const shareBtn = document.createElement("button");
  shareBtn.textContent = "🔗 Share";
  shareBtn.onclick = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(article.url).then(() => alert("Link copied to clipboard!"));
  };
  card.querySelector(".card-content").appendChild(shareBtn);
};

const updateBookmarkBtn = (btn, article) => {
  const isSaved = isBookmarked(article.url);
  btn.textContent = isSaved ? "Remove ⭐" : "⭐";
  btn.onclick = (e) => {
    e.stopPropagation();
    isSaved ? removeBookmark(article) : saveBookmark(article);
  };
};

const saveBookmark = (article) => {
  const bookmarks = getFromStorage("bookmarks");
  if (bookmarks.some(b => b.url === article.url)) return alert("Already bookmarked!");
  bookmarks.push(article);
  setToStorage("bookmarks", bookmarks);
  alert("Article bookmarked!");
};

const removeBookmark = (article) => {
  const updated = getFromStorage("bookmarks").filter(b => b.url !== article.url);
  setToStorage("bookmarks", updated);
  alert("Bookmark removed!");
  showBookmarks();
};

// === Search Handler ===
const handleSearch = () => {
  const query = input.value.trim();
  if (!query) return;
  getNews(query, selectedLang);
  activeNav?.classList.remove("active");
  activeNav = null;
};

btn.onclick = handleSearch;
input.addEventListener("keyup", (e) => e.key === "Enter" && handleSearch());

// === Language Change ===
langSelect.onchange = () => {
  selectedLang = langSelect.value;
  localStorage.setItem("language", selectedLang);
  getNews(input.value || "India", selectedLang);
};

// === Theme ===
themeToggle.onclick = () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

const loadTheme = () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
};

// === Bookmarks ===
const showBookmarks = () => {
  const bookmarks = getFromStorage("bookmarks");
  bookmarks.length ? renderNews(bookmarks) : show(cards, "No bookmarks found.");
};

// === Mic Input ===
micBtn.onclick = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert("Speech recognition not supported!");

  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.start();

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    input.value = transcript;
    handleSearch();
  };
};

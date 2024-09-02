const Fuse = window.Fuse;
const fuseOptions = {
  keys: ["title"],
  includeScore: true,
  threshold: 0.3, // Adjust this for fuzziness, lower is more precise
};


function addStarToFillerEpisodes(fillerEpisodes) {
  const episodeCards = document.querySelectorAll(".playable-card--GnRbX");
  console.log();
  episodeCards.forEach((card) => {
    if (card.querySelector(".filler-star")) {
      return; // Skip if the star is already added
    }
    const titleElement = card.querySelector(".playable-card__title--rgmp7");
    if (titleElement) {
      const episodeTitle = titleElement.textContent;
      const episodeNumber = episodeTitle.match(/E(\d+)/);
      if (
        episodeNumber &&
        fillerEpisodes.includes(parseInt(episodeNumber[1], 10))
      ) {
        const star = document.createElement("div");
        star.className = "filler-star";
        star.title = "Filler Episode";
        star.textContent = "F";
        card.style.position = "relative";
        card.appendChild(star);
      }
    }
  });
}

function getAnimeTitle() {
  const titleElement = document.querySelector(".hero-heading-line");
  const titleElementH1 = titleElement.querySelector("h1");
  return titleElementH1 ? titleElementH1.textContent.trim() : null;
}

function getFillerListUrl(animeTitle, fuseAgent) {
  const result = fuseAgent.search(animeTitle);
  const preciseMatch = result.find(
    (item) => item.item.title.toLowerCase() === animeTitle.toLowerCase()
  );
  if (preciseMatch) {
    return `https://www.animefillerlist.com/shows/${preciseMatch.item.url.toLowerCase()}`;
  } else if (result) {
    return `https://www.animefillerlist.com/shows/${result[0].item.url.toLowerCase()}`;
  } else {
    formattedTitle = animeTitle.toLowerCase().replace(/\s+/g, "-");
    return `https://www.animefillerlist.com/shows/${formattedTitle}`;
  }
}

function handleShowMoreButtonClick(fillerEpisodes) {
  const showMoreButton = document.querySelector(
    'button[data-t="show-more-btn"]'
  );
  if (showMoreButton) {
    showMoreButton.addEventListener("click", () => {
      // Wait for the new episodes to load
      setTimeout(() => {
        addStarToFillerEpisodes(fillerEpisodes);
      }, 50); // Adjust the delay as needed
    });
  }
}

function fetchFormattedTitleJSON() {
  const jsonUrl =
    "https://raw.githubusercontent.com/tejitpabari99/crunchy-filler/main/crunchyName_animeFillerUrlName.json"; // Replace with your actual GitHub URL

  return fetch(jsonUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch JSON data");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching or parsing JSON:", error);
      return null;
    });
}

function initializeFillerMarker() {
  const animeTitle = getAnimeTitle();
  console.log("Anime Title:", animeTitle);
  if (animeTitle) {
    fetchFormattedTitleJSON().then((formattedTitleJSON) => {
      const fuseAgent = new Fuse(formattedTitleJSON, fuseOptions);

      const fillerListUrl = getFillerListUrl(animeTitle, fuseAgent);
      if (fillerListUrl) {
        chrome.runtime.sendMessage(
          { action: "getFillerEpisodes", url: fillerListUrl },
          (response) => {
            if (response.fillerEpisodes) {
              setTimeout(() => {
                addStarToFillerEpisodes(response.fillerEpisodes);
              }, 1000);
              handleShowMoreButtonClick(response.fillerEpisodes);
            } else {
              console.error("Failed to get filler episodes:", response.error);
            }
          }
        );
      } else {
        console.error("Failed to generate filler list URL");
      }
    });
  } else {
    console.error("Failed to get anime title");
  }
}

// Use MutationObserver to wait for the title element to appear
const observer = new MutationObserver((mutations, obs) => {
  const titleElement = document.querySelector(
    ".hero-heading-line .heading--nKNOf"
  );
  if (titleElement) {
    // obs.disconnect();
    initializeFillerMarker();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Fallback: If the element doesn't appear after 5 seconds, try to initialize anyway
setTimeout(() => {
  if (!document.querySelector(".hero-heading-line .heading--nKNOf")) {
    console.warn(
      "Title element not found after timeout, attempting to initialize anyway"
    );
    initializeFillerMarker();
  }
}, 5000);

"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn=false) {
  console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const showStar = Boolean(currentUser);
  return $(`
      <li id="${story.storyId}">
      ${showDeleteBtn ? getDeleteBtnHTML() : ""}
      ${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}
function getStarHTML(story, user) {
  const isFavorite = user.isFav(story);
  const starType = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}
function getDeleteBtnHTML() {
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    if (currentUser != undefined) {
      const userStoryIds = currentUser.ownStories.map(s => s.storyId);
      let $story;
      if (userStoryIds.includes(story.storyId)){
        //if the user owns the story, add delete key
        $story = generateStoryMarkup(story, true);
      } else {
        $story = generateStoryMarkup(story);
      }
      $allStoriesList.append($story);
    } 
    else {
      let $story = generateStoryMarkup(story);
      $allStoriesList.append($story)
    }
 
    
  }

  $allStoriesList.show();
}

async function submitStory(evt) {
  console.debug("submitStory");
  evt.preventDefault();

  //get form data values to create new story
  const author = $("#new-author").val();
  const title = $("#new-title").val();
  const url = $("#new-url").val();
 
  const storyData = {author, title, url};

  //make new story
  let newStory = await storyList.addStory(currentUser, storyData); 

  //add new story to story list
  $allStoriesList.prepend(generateStoryMarkup(newStory, true));

  //reset form
  $submitForm.hide();
  $submitForm.trigger("reset");
  
}

$submitForm.on("submit", submitStory);

function favoritesList() {
  console.debug("favoritesList");
  console.log("working")
  $favStories.empty();

  if(currentUser.favorites.length == 0) {
    $favStories.append("<h1>No favorite stories</h1>");
  }
  else {
    for (const story of currentUser.favorites) {
      $favStories.append(generateStoryMarkup(story));
    }
  }
  $favStories.show();
}

async function toggleFavorite(evt) {
  console.debug("toggleFavorite");

  //get the closet li element
  const $tgt = $(evt.target);
  const $li = $tgt.closest("li");

  //find the story using the id
  const storyId = $li.attr("id");
  const story = storyList.stories.find(s => s.storyId == storyId);

  //toggle favorite
  //if its already favorited, remove favorite
  if ($tgt.hasClass("fas")){
    await currentUser.removeFav(story);
    $tgt.closest("i").toggleClass("fas far");
  }
  else {
    await currentUser.addFav(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}

$storiesList.on("click", ".star", toggleFavorite)

async function deleteStory(evt) {
  console.debug("deleteStory");
  console.log("dlete")
  const $li = $(evt.target).closest("li");
  const storyId = $li.attr("id");
  await storyList.removeStory(currentUser, storyId);

  //refresh stories on page to remove story from view
  putStoriesOnPage();
}

$body.on("click", ".trash-can", deleteStory);
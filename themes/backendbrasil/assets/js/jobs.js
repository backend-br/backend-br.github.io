const globals = {
  issuesPage: 1
};

const DOM = {
  stateSelect: $("#state"),
  keywordInput: $("#keyword"),
  clearFilter: $("#clearFilter"),
  moreJobs: $("#loadMoreJobs"),
  jobsList: $("#jobsListingWrapper")
};

const getJobs = filter => {
  const url = "https://api.github.com/repos/backend-br/vagas/issues";

  $.getJSON(url, { page: globals.issuesPage++ }, data => {
    data
      .map(issue => ({
        url: issue.html_url,
        title: getTitle(issue.title),
        location: getLocation(issue.title),
        labels: issue.labels.map(label => label.name),
        id: issue.id
      }))
      .filter(issue => !$(`article[data-id='${issue.id}']`).length)
      .forEach(issue => {
        DOM.jobsList.append(generateJob(issue));
      });

    if (!data.length) {
      DOM.moreJobs.html(DOM.moreJobs.attr("data-is-empty"));
      DOM.moreJobs.attr("disabled", true);
    }

    if (filter) {
      filter();
    }
  });
};

// Generators
const generateJob = ({ id, labels, location, title, url }) => `
  <article 
    class="
      jobs--listing-item 
      no-grow no-shrink tile 
      is-flex-one-quarter-desktop 
      is-flex-one-third-mobile 
      is-flex-full"

    data-id="${id}"
    data-labels="${labels}"
    data-location="${location}"
    data-title="${title}"
  >
    <a href="${url}" target="_blank">
      <h4 class="is-size-5">${title}</h4>
      ${generateLabels(labels)}
      ${generateLocation(location)}
    </a>
  </article>`;

const generateLabels = labels => {
  if (!labels) return "";

  return `
    <ul class="jobs--flags">
      ${labels.map(label => `<li>${label}</li>`).join("")}
    </ul>
  `;
};

const generateLocation = location => {
  if (!location) return "";

  return `
    <p>
      <span class="fas fa-map"></span>
      <span>${location}</span>
    </p>`;
};

// Formatters
const getLocation = location =>
  Array(location.match(/^(?:\[)(.*?)(?:\])/g))
    .join("")
    .replace(/\[|\]/g, "");

const getTitle = title => title.replace(/^\[(.*?)\]\s?/g, "").slice(0, 60);

// Event Handlers
DOM.stateSelect.on("change", _ => applyFilters());
DOM.keywordInput.on("input", _ => applyFilters());
DOM.clearFilter.on("click", _ => clearFilters());
DOM.moreJobs.on("click", _ => {
  if (DOM.moreJobs.attr("disabled") != "true") {
    getJobs(applyFilters);
  }
});

const applyFilters = () => {
  // XXX: Zepto não dá suporte ao ":selected" e não tem selectedIndex
  const stateName =
    DOM.stateSelect[0].options[DOM.stateSelect[0].selectedIndex].text;
  const stateInitials = DOM.stateSelect.val();
  const text = DOM.keywordInput.val();
  let stateFound = true;

  DOM.jobsList.find(".jobs--listing-item").forEach(job => {
    const keys = ["labels", "location", "title"];
    const textFound = keys
      .map(key => new RegExp(text, "gi").test(job.dataset[key]))
      .some(x => x);

    if (stateInitials != "clear") {
      stateFound = new RegExp(
        `\\b${stateName}\\b|\\b${stateInitials}\\b`,
        "gi"
      ).test(job.dataset["location"]);
    }

    if (stateFound && textFound) {
      return $(job).removeClass("jobs--listing-hidden");
    }

    $(job).addClass("jobs--listing-hidden");
  });
};

const clearFilters = () => {
  DOM.stateSelect.val("clear");
  DOM.keywordInput.val("");
  DOM.jobsList
    .find(".jobs--listing-hidden")
    .removeClass("jobs--listing-hidden");
};

getJobs();

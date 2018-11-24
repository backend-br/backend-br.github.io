document.addEventListener('DOMContentLoaded', () => {
  if ($('#state').length) {
    const generateLabels = labels => {
      labels = Array.isArray(labels) ? labels : [labels]

      labels = labels.map(label => `<li>${label}</li>`)
      labels = labels.join()

      return `
        <ul class="jobs--flags">
          ${labels}
        </ul>
      `;
    };
    const generateJob = ({ url, title, labels, location }) = `
      <article class="
        jobs--listing-item 
        no-grow 
        no-shrink 
        is-child tile 
        is-flex-one-quarter-desktop
        is-flex-half-mobile
        is-flex-full
      ">
        <a href="${url}" target="_blank">
          <h4 class="is-size-5">${title}</h4>

          ${generateLabels(labels)}

          <p>
            <span class="fas fa-map"></span>
            <span>${location}</span>
          </p>
        </a>
      </article>
    `;

    const getLocation = title => {
      const regex = /\[(.*)\]/g

      const result = title.match(regex)

      if (Array.isArray(result)) {
        return result.shift()
      }

      return ''
    };

    $.getJSON(
      'https://api.github.com/repos/backend-br/vagas/issues',
      data => {
        data = $.map(data, issue => ({
          url: issue.html_url,
          title: issue.title,
          location: getLocation(title),
          labels: $.map(issue.labels, label => label.name)
        }))
      }
    )
  }
})

document.addEventListener('DOMContentLoaded', () => {
  const hideClass = 'category-filter-is-hidden';
  const deactivateButton = $('#deactivateCategoryFilter')

  if ($('.category-filter-is-hidden').length > 0) {
    deactivateButton.removeClass('is-hidden');
  }

  deactivateButton.on('click', e => {
    $(`.${hideClass}`).removeClass(hideClass)
    deactivateButton.parent().addClass('is-hidden')
  })

  $('.blog--themes li > a').on('click', e => {
    const dataset = e.target.dataset

    if (!dataset.slug || dataset.slug.length === 0) {
      return
    }

    if (deactivateButton.parent().hasClass('is-hidden')) {
      deactivateButton.parent().removeClass('is-hidden');
    }

    const slug = dataset.slug
    $('article[data-categories]').removeClass(hideClass)

    Object
      .values($('article[data-categories]'))
      .filter(
        ({dataset = {}}) => 
          dataset.categories && 
          dataset.categories.indexOf(slug) === -1
      )
      .forEach(post => {
        $(post).addClass(hideClass);
      })
  })
})

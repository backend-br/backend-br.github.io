document.addEventListener('DOMContentLoaded', () => {
  if ($('.article--content').length) {
    $('.article--content a')
      .forEach(anchor => {
        $(anchor).attr('target', '_blank')
      })
  }
})

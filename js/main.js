/* globals skrollr, $ */

var s = skrollr.init({
  forceHeight: false
});

(function() {
  $('.projects__slider').slick({
    dots: true,
    infinite: true,
    speed: 300,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    responsive: [
      {
        breakpoint: 1000,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  });

  var $contactForm = $('.contact__form');
  var $contactOutput = $('.js-contact-output');
  $contactForm.submit(function(e) {
    e.preventDefault();
    var url = $contactForm.attr('action');
    $.ajax({
      url: url,
      method: 'POST',
      data: $(this).serialize(),
      dataType: 'json',
      beforeSend: function() {
        $contactOutput.append('<div class="contact__alert contact__alert--loading">Sending message…</div>');
      },
      success: function(data) {
        $contactOutput.find('.contact__alert--loading').hide();
        $contactOutput.append('<div class="contact__alert contact__alert--success">Message sent!</div>');
      },
      error: function(err) {
        $contactOutput.find('.contact__alert--loading').hide();
        $contactOutput.append('<div class="contact__alert contact__alert--error">Ops, there was an error.</div>');
      }
    });
  });

  // get stars number
  // slick slider duplicates the items to simulate the infinite slide, we then want to make an ajax request for each project
  // and not for each card, otherwise we'll end up making a lot of useless requests
  var stars = {};
  $('.stars-counter').each(function() {
    var author = $(this).attr('data-author');
    var project = $(this).attr('data-project');
    var field = $(this).find('.stars-counter__number');
    var path = author + '/' + project;
    if (!stars[path]) {
      stars[path] = true;
      $.get('https://apis.github.com/repos/' + path, function(data) {
        stars[path] = data.stargazers_count;
      }).fail(function() {
        stars[path] = '?';
      }).always(function() {
        $('.stars-counter[data-author="' + author + '"][data-project="' + project + '"] .stars-counter__number').text(stars[path]);
      });
    }
  });

})();

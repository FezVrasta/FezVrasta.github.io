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
})();

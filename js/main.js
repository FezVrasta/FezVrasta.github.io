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
})();

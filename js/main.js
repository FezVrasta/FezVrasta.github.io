/* globals skrollr, Swiper */

var s = skrollr.init({
  forceHeight: false
});

var mySwiper = new Swiper('.swiper-container', {
  // Optional parameters
  direction: 'horizontal',
  loop: true,
  slidesPerView: 3,
  centeredSlides: true,

  // If we need pagination
  pagination: '.swiper-pagination'
});

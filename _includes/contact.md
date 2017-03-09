<form class="contact__form" action="//formspree.io/federico.zivolo@gmail.com" method="POST" id="contactForm">
  <h1 class="contact__title">Get in touch</h1>
  <p class="contact__subtitle">It would be awesome!</p>
  <div class="contact__form-row">
    <input class="contact__field" type="text" name="name" required placeholder="Name">
    <input class="contact__field" type="email" name="email" required placeholder="E-mail">
  </div>
  <div class="contact__form-row">
    <textarea class="contact__field" rows="7" name="message" required placeholder="Message"></textarea>
  </div>
  <div class="contact__form-row contact__form-row--submit">
    <div class="contact__submit-box">
      <button
        type="submit" 
        class="button button--big contact__submit"
        data-sitekey="6LfTXBgUAAAAAFfgJ__Rsrf2WCWoV8LuJtmmmZ5W"
        data-callback="YourOnSubmitFn">
        Send Message
      </button>
      <div class="contact__feedback js-contact-output">
        <div class="contact__alert contact__alert--loading js-loading" style="display: none;">Sending message…</div>
        <div class="contact__alert contact__alert--success js-success" style="display: none;">Message sent!</div>
        <div class="contact__alert contact__alert--error js-error" style="display: none;">Ops, there was an error.</div>
      </div>
    </div>
  </div>
</form>

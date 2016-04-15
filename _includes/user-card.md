<div class="perspective-fixed"
    data-80p="visibility: visible; opacity: 1;"
    data-81p="visibility: hidden; opacity: 0;"
>
  <section class="user-card"
    data-20p="transform: scale(1);"
    data-100p="transform: scale(0.8);"
    data-101p="transform: scale(0);"
  >
    <div class="user-card__avatar" tabindex="0">
      <div class="user-card__avatar-image user-card__avatar-image--white"></div>
      <div class="user-card__avatar-flipper">
        <img class="user-card__avatar-image user-card__avatar-image--front" src="{{site.data.about.avatar1}}">
        <img class="user-card__avatar-image user-card__avatar-image--back" src="{{site.data.about.avatar2}}">
      </div>
    </div>
    <h1 class="user-card__name">{{site.data.about.name}}</h1>
    <h2 class="user-card__title">{{site.data.about.title}}</h2>
    <div class="user-card__bio-buttons">
      <button class="user-card__bio-button js-show-bio">about me</button>
      <a href="./CV_Federico_Zivolo.pdf" target="_blank" class="user-card__resumee-button">resume</a>
    </div>
    <section class="user-card__bio user-card__bio--hidden">
      <div class="user-card__bio-content">
        {{ site.data.about.bio | markdownify }}
        <button class="user-card__back js-hide-bio">Back</button>
      </div>
    </section>

  <div class="user-card__social">
      {% for social in site.data.about.social %}
        <a class="user-card__social-icon" href="{{social.url}}" target="_blank" title="{{social.name}}">
          {% include {{social.icon}} %}
        </a>
      {% endfor %}
    </div>
  </section>
</div>

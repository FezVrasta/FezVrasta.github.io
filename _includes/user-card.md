<section class="user-card" data-center="transform: translateY(0%) scale(1);" data-center-bottom="opacity: 1;" data-top-bottom="transform: translateY(100%) scale(0.8); opacity: 0;">
  <div class="user-card__avatar" tabindex="0">
    <div class="user-card__avatar-image user-card__avatar-image--white"></div>
    <div class="user-card__avatar-flipper">
      <img class="user-card__avatar-image user-card__avatar-image--front" src="{{site.data.about.avatar1}}">
      <img class="user-card__avatar-image user-card__avatar-image--back" src="{{site.data.about.avatar2}}">
    </div>
  </div>
  <h1 class="user-card__name">{{site.data.about.name}}</h1>
  <h2 class="user-card__title">{{site.data.about.title}}</h2>

<div class="user-card__social">
    {% for social in site.data.about.social %}
      <a class="user-card__social-icon" href="{{social.url}}" target="_blank" title="{{social.name}}">
        {% include {{social.icon}} %}
      </a>
    {% endfor %}
  </div>
</section>

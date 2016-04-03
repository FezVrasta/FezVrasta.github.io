<h1 class="projects__title">Projects</h1>

<section class="projects__slider" data-bottom-top="opacity: 0; transform: scale(0.5);" data-center-top="opacity: 1; transform: scale(1);">
  {% for project in site.data.projects.projects %}
    <article class="project">
      <h2 class="project__title">{{ project.name }}</h2>
      <div class="stars-counter" data-author="{{ project.author}}" data-project="{{ project.project }}">
        {% include star.svg %}
        <span class="stars-counter__number"></span>
      </div>
      <p class="project__description">{{ project.description }}</p>
      <a class="button" href="{{ project.url }}" target="_blank">Visit the project page</a>
    </article>
  {% endfor %}
</section>

<section class="projects__more">
  <p class="projects__more-description">
    View the whole list of projects visiting my GitHub account.
  </p>
  <a href="{{site.data.about.github}}" target="_blank" class="button button--big">GitHub Account</a>
  
</section>

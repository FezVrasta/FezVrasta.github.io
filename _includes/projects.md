<h1 class="projects__title">Projects</h1>

<section class="projects__slider">
  {% for project in site.data.projects.projects %}
    <article class="project">
      <h2 class="project__title">{{ project.name }}</h2>
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

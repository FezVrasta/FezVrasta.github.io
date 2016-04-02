<h1 class="projects__title">Projects</h1>

<section class="swiper-container projects__slider">
    <div class="swiper-wrapper">
        {% for project in site.data.projects.projects %}
          <article class="swiper-slide project">
            <div class="project__content">
              <h2 class="project__title">{{ project.name }}</h2>
              <p>{{ project.description }}</p>
              <a class="project__button" href="{{ project.url }}" target="_blank">Visit the project page</a>
            </div>
          </article>
        {% endfor %}
        ...
    </div>
    <div class="swiper-pagination"></div>
</section>

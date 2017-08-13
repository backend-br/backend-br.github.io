<template>
  <div class="hello">
    <md-toolbar>
      <md-button class="md-icon-button">
        <md-icon>menu</md-icon>
      </md-button>
      <h2 class="md-title" style="flex: 1">Default</h2>
      <md-button class="md-icon-button">
        <md-icon>favorite</md-icon>
      </md-button>
    </md-toolbar>
    <md-tabs md-centered>
      <md-tab md-label="Movies" md-icon="ondemand_video">
        <md-card style="width: 320px;" class="card-ripple" md-with-hover>
          <md-card-media>
            <md-ink-ripple></md-ink-ripple>
            <img src="https://vuematerial.github.io/assets/card-image-1.jpg" alt="People">
          </md-card-media>
          <md-card-actions>
            <md-button class="md-icon-button">
              <md-icon>favorite</md-icon>
            </md-button>
            <md-button class="md-icon-button">
              <md-icon>bookmark</md-icon>
            </md-button>
            <md-button class="md-icon-button">
              <md-icon>people</md-icon>
            </md-button>
          </md-card-actions>
        </md-card>
      </md-tab>
      <md-tab md-label="Music" md-icon="music_note">
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt dolorum quas amet cum vitae, omnis! Illum quas voluptatem, expedita iste, dicta ipsum ea veniam dolore in, quod saepe reiciendis nihil.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt dolorum quas amet cum vitae, omnis! Illum quas voluptatem, expedita iste, dicta ipsum ea veniam dolore in, quod saepe reiciendis nihil.</p>
      </md-tab>
      <md-tab md-label="Books" md-icon="books">
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt dolorum quas.</p>
      </md-tab>
      <md-tab md-label="Contribuidores" md-icon="people">
        <md-avatar class="md-large">
          <img src="http://lorempixel.com/100/100/" alt="People">
          Reginaldo Junior
        </md-avatar>
        <md-avatar class="md-large">
          <img src="http://lorempixel.com/100/100/" alt="People">
          Reginaldo Junior
        </md-avatar>
        <md-avatar class="md-large">
          <img src="http://lorempixel.com/100/100/" alt="People">
          Reginaldo Junior
        </md-avatar>
      </md-tab>
    </md-tabs>
  </div>
</template>

<script>
export default {
  name: 'hello',
  data () {
    return {
      msg: 'Welcome'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>

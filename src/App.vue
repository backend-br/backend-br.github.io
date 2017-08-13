<template>
  <div id="app">
    <router-view></router-view>
    

    <md-toolbar class="footer">
      <div class="md-title" style="flex: 1">
        <img src="https://avatars3.githubusercontent.com/u/30732658?v=4&s=50" />
        <p>MIT Licence - BackEnd BR</p>
      </div>
    </md-toolbar>
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#app .md-layout {
  margin-right: 10px;
  margin-left: 10px;
}

.md-title img {
  margin-top: 10px;
}

.md-title p {
  font-size: 12px;
}

.footer {
    background-color: #3f51b5;
    color: rgba(255, 255, 255, .87);
    bottom: 0;
    position: absolute;
    width: 100%;
}
</style>

<template>
  <div class="custom-layout">
    <aside>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <!-- Add more navigation items as needed -->
        </ul>
      </nav>
    </aside>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomLayout',
}
</script>

<style scoped>
.custom-layout {
  display: flex;
  min-height: 100vh;
}
aside {
  width: 200px;
  background: #e0e0e0;
  padding: 1rem;
}
.content {
  flex: 1;
  padding: 1rem;
}
</style>
<template>
  <div class="default-layout">
    <header>
      <h1>Default Header</h1>
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <p>Default Footer</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'DefaultLayout',
}
</script>

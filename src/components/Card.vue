<template>
  <div class="column">
    <div class="card">
      <header class="card-header">
        <p class="card-header-title">
          {{ title }}
        </p>
      </header>
      <div class="card-content">
        <div class="content has-text-centered">
          <slot>---</slot>
        </div>
      </div>
      <footer class="card-footer">
        <slot name='footer'>---</slot>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    }
  }
}
</script>

<template>
  <section class="section">
    <no-ssr placeholder="Loading...">
      <Race />
    </no-ssr>
  </section>
</template>

<script>
import Race from '~/components/Race'

export default {
  name: 'RacePage',
  components: { Race }
}
</script>

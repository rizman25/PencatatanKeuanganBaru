<script lang="ts">
  import BottomNav from '$lib/components/BottomNav.svelte';
  let { children, data } = $props();
</script>

<div class="scroll noscroll">
  {@render children()}
</div>
<BottomNav month={data.month} />

<style>
  .scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>

<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<!--
  Full-bleed on a phone, which is where this is actually used (ADR-0009 / mobile-first).
  On a wider screen it becomes a centred column on the paper backdrop rather than
  stretching a phone layout across a monitor.
-->
<div class="frame">
  <div class="screen">
    {@render children()}
  </div>
</div>

<style>
  .frame {
    min-height: 100dvh;
    display: flex;
    justify-content: center;
    background: var(--paper);
  }

  .screen {
    width: 100%;
    max-width: 480px;
    min-height: 100dvh;
    background: var(--surface);
    position: relative;
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 520px) {
    .frame {
      padding: 24px 0;
    }
    .screen {
      min-height: calc(100dvh - 48px);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.16);
    }
  }
</style>

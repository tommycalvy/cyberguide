<script context="module" lang="ts">
    import type {
      PlasmoCSConfig,
      PlasmoGetInlineAnchor,
      PlasmoMountShadowHost
    } from "plasmo"
  
    export const config: PlasmoCSConfig = {
      matches: ["https://www.plasmo.com/*"]
    }
  
    export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
      document.querySelector("#supercharge > h3 > span")
  
    export const mountShadowHost: PlasmoMountShadowHost = ({ 
      anchor, shadowHost 
    }) => {
      anchor!.element!.insertBefore(shadowHost!, anchor!.element!.firstChild)
    }
  </script>

<div class="drawer">
    <h1>Cyber Guide</h1>
</div>

<style>
  .drawer {
    width: 300px;
    height: 100%;
    position: fixed;
    top: 0;
    right: 0;
    background-color: white;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.3);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
</style>
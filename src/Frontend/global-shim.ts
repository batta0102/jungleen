/**
 * sockjs-client (STOMP) référence `global` comme en Node. Dans le navigateur bundlé,
 * cette variable n’existe pas → erreur au chargement du module → écran blanc dès l’import de la cloche.
 */
const g = globalThis as typeof globalThis & { global?: typeof globalThis };
if (typeof g.global === 'undefined') {
  g.global = g;
}

/**
 * Lightweight runtime loader for <model-viewer> without changing app structure.
 * Loads once globally for classroom 3D preview.
 */
const w = globalThis as typeof globalThis & {
  customElements?: CustomElementRegistry;
  document?: Document;
  __modelViewerBootstrapped?: boolean;
};
if (!w.__modelViewerBootstrapped && w.document && (!w.customElements || !w.customElements.get('model-viewer'))) {
  w.__modelViewerBootstrapped = true;
  const script = w.document.createElement('script');
  script.type = 'module';
  script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
  w.document.head.appendChild(script);
}

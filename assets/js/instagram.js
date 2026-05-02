/**
 * Instagram Feed — Karina Petelin
 *
 * Requiere un Access Token de Instagram Graph API (larga duración, 60 días).
 * Pasos para obtenerlo:
 *   1. Convertir la cuenta de Instagram a "Profesional" (Empresa o Creador)
 *   2. Crear una app en developers.facebook.com → "Consumer" type
 *   3. Agregar el producto "Instagram" → "Instagram Basic Display"
 *   4. En "User Token Generator", generar el token de usuario
 *   5. Convertirlo a token de larga duración via:
 *      https://graph.instagram.com/access_token
 *        ?grant_type=ig_exchange_token
 *        &client_id={app-id}
 *        &client_secret={app-secret}
 *        &access_token={short-lived-token}
 *   6. Pegarlo en IG_ACCESS_TOKEN abajo.
 *
 * Renovación: el token dura 60 días. Para renovarlo antes de que venza:
 *   GET https://graph.instagram.com/refresh_access_token
 *     ?grant_type=ig_refresh_token
 *     &access_token={token-actual}
 */

(function () {
  'use strict';

  /* ── CONFIGURACIÓN ────────────────────────────────────────── */
  var IG_ACCESS_TOKEN = 'TU_ACCESS_TOKEN_AQUI';
  var IG_NUM_POSTS    = 9;
  var IG_PROFILE_URL  = 'https://instagram.com/karina_petelin/';
  /* ─────────────────────────────────────────────────────────── */

  var FIELDS   = 'id,media_type,media_url,thumbnail_url,permalink,timestamp';
  var API_URL  = 'https://graph.instagram.com/me/media'
    + '?fields=' + FIELDS
    + '&limit=' + IG_NUM_POSTS
    + '&access_token=' + IG_ACCESS_TOKEN;

  function buildCell(post) {
    var imgSrc = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
    var isVideo = post.media_type === 'VIDEO' || post.media_type === 'VIDEO_STORY';
    var date = post.timestamp ? new Date(post.timestamp).toLocaleDateString('es-AR') : '';

    return '<a class="ig-cell ig-cell--live" href="' + post.permalink + '"'
      + ' target="_blank" rel="noopener noreferrer"'
      + ' aria-label="Ver publicación del ' + date + ' en Instagram">'
      + '<img src="' + imgSrc + '" alt="Publicación Instagram ' + date + '" loading="lazy">'
      + '<div class="ig-overlay" aria-hidden="true">'
      + '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">'
      + '<rect x="2" y="2" width="20" height="20" rx="5"/>'
      + '<circle cx="12" cy="12" r="4"/>'
      + '<circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>'
      + '</svg>'
      + '</div>'
      + (isVideo ? '<span class="ig-video-badge" aria-hidden="true">&#9654;</span>' : '')
      + '</a>';
  }

  function renderFeed(posts) {
    var grid = document.querySelector('.ig-grid');
    if (!grid) return;
    grid.innerHTML = posts.slice(0, IG_NUM_POSTS).map(buildCell).join('');
  }

  function loadFeed() {
    if (!IG_ACCESS_TOKEN || IG_ACCESS_TOKEN === 'TU_ACCESS_TOKEN_AQUI') {
      console.info('[IG Feed] Configurá tu access token en assets/js/instagram.js');
      return;
    }

    fetch(API_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data.data || !data.data.length) throw new Error('Sin publicaciones');
        renderFeed(data.data);
      })
      .catch(function (err) {
        console.warn('[IG Feed] No se pudo cargar el feed:', err.message);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFeed);
  } else {
    loadFeed();
  }

})();

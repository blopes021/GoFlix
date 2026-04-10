/**
 * Monetag Integration Service
 * Handles ad script injection and direct link redirection.
 */

export const monetagService = {
  /**
   * Injects the Monetag Smart Tag script into the document head.
   */
  initSmartTag: () => {
    const tagId = import.meta.env.VITE_MONETAG_TAG_ID;
    if (!tagId) return;

    // Check if script already exists
    if (document.getElementById('monetag-smart-tag')) return;

    const script = document.createElement('script');
    script.id = 'monetag-smart-tag';
    script.src = `https://alwingulla.com/88/tag.min.js`;
    script.dataset.zone = tagId;
    script.async = true;
    script.dataset.pnd = 'true';
    document.head.appendChild(script);
  },

  /**
   * Returns the Monetag Direct Link URL.
   */
  getDirectLink: () => {
    return import.meta.env.VITE_MONETAG_DIRECT_LINK || '#';
  },

  /**
   * Opens the Monetag Direct Link in a new tab.
   */
  showAd: () => {
    const link = monetagService.getDirectLink();
    if (link && link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
      return true;
    }
    return false;
  }
};

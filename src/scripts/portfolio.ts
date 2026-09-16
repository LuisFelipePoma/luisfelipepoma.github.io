import {copyEmail} from './copy-email';

function initializeClipboard() {
  const button = document.querySelector<HTMLButtonElement>('[data-copy-email]');
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  const label = button?.querySelector('span');
  if (!button || !status || !label) return;
  const originalLabel = label.textContent || '';
  button.hidden = false;
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    status.textContent = '';
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    label.textContent = button.dataset.pending || originalLabel;
    const success = await copyEmail(button.dataset.copyEmail || '', navigator.clipboard);
    status.textContent = (success ? button.dataset.success : button.dataset.error) || '';
    label.textContent = originalLabel;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  });
}

export function initializePortfolio() {
  initializeClipboard();
  // Keep basic contact interaction independent of the graphics bundle.
  void import('./approved-player').then(module=>module.initializeApprovedMatter()).catch(error=>{
    console.error('Matter player could not load:',error);
    document.querySelectorAll<HTMLElement>('[data-matter-fallback]').forEach(el=>el.hidden=false);
  });
}

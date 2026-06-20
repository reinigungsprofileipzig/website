document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const menuButton = document.querySelector('.menu-toggle') || document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-nav') || document.getElementById('mobile-menu');
  if (menuButton && mobileMenu && !menuButton.hasAttribute('onclick')) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      mobileMenu.classList.toggle('open', open);
      mobileMenu.classList.toggle('hidden', !open);
      document.body.classList.toggle('menu-open', open);
      const icon = menuButton.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars', !open);
        icon.classList.toggle('fa-xmark', open);
      }
    });
  }

  document.querySelectorAll('.mobile-nav details > summary').forEach(summary => {
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', String(summary.parentElement.open));
    summary.addEventListener('click', event => {
      event.preventDefault();
      const details = summary.parentElement;
      const open = !details.open;
      details.open = open;
      summary.setAttribute('aria-expanded', String(open));
    });
  });

  document.querySelectorAll('.dropdown-toggle-mobile').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const menu = toggle.nextElementSibling;
      if (!menu) return;
      const open = menu.classList.contains('hidden');
      menu.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
    });
  });

  const updateDistrict = trigger => {
    const title = document.getElementById('district-detail-title');
    const districtLabel = document.getElementById('district-detail-district');
    const districtCopy = document.getElementById('district-detail-copy');
    const list = document.getElementById('district-detail-list');
    if (!title || !list) return;
    const district = trigger.dataset.district;
    const selectedPlace = trigger.dataset.place || '';
    document.querySelectorAll('.map-neighborhood').forEach(item => {
      item.classList.toggle('active', item === trigger);
      item.classList.toggle('district-active', item.dataset.district === district);
    });
    document.querySelectorAll('.map-legend-item').forEach(item => {
      const active = item.dataset.district === district;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    title.textContent = selectedPlace || district;
    if (districtLabel) districtLabel.textContent = selectedPlace ? `Ortsteil im Stadtbezirk ${district}` : `Stadtbezirk mit ${trigger.dataset.places.split('|').length} Ortsteilen`;
    if (districtCopy) districtCopy.textContent = trigger.dataset.context || '';
    const mobileSelect = document.getElementById('mobile-district-select');
    if (mobileSelect && selectedPlace) mobileSelect.value = selectedPlace;
    list.replaceChildren(...trigger.dataset.places.split('|').map(place => {
      const item = document.createElement('li');
      item.textContent = place;
      item.classList.toggle('selected', place === selectedPlace);
      return item;
    }));
  };
  document.querySelectorAll('.map-neighborhood, .map-legend-item').forEach(trigger => {
    trigger.addEventListener('click', () => updateDistrict(trigger));
    trigger.addEventListener('focus', () => updateDistrict(trigger));
  });
  const mobileDistrictSelect = document.getElementById('mobile-district-select');
  if (mobileDistrictSelect) {
    const selectDistrict = () => {
      const area = [...document.querySelectorAll('.map-neighborhood')].find(item => item.dataset.place === mobileDistrictSelect.value);
      if (area) updateDistrict(area);
    };
    mobileDistrictSelect.addEventListener('input', selectDistrict);
    mobileDistrictSelect.addEventListener('change', selectDistrict);
  }
  document.querySelectorAll('.map-neighborhood').forEach(area => {
    area.addEventListener('mouseenter', () => updateDistrict(area));
    area.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        updateDistrict(area);
      }
    });
  });

  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(item => item.classList.toggle('active', item === button));
      const filter = button.dataset.filter;
      document.querySelectorAll('.service-card').forEach(card => {
        card.hidden = filter !== 'all' && card.dataset.category !== filter;
      });
    });
  });

  const params = new URLSearchParams(window.location.search);
  document.querySelectorAll('.js-contact-form').forEach(form => {
    const status = form.querySelector('.form-status');
    if (status && ['success', 'sent', '1'].includes(params.get('status')) || status && params.get('sent') === '1') {
      status.hidden = false;
      status.textContent = 'Vielen Dank. Ihre Anfrage wurde gesendet. Wir melden uns schnellstmöglich.';
    }
    form.addEventListener('invalid', () => {
      if (status) {
        status.hidden = false;
        status.textContent = 'Bitte prüfen Sie die markierten Pflichtfelder.';
      }
    }, true);
    form.addEventListener('submit', () => {
      if (status) {
        status.hidden = false;
        status.textContent = 'Ihre Anfrage wird gesendet …';
      }
    });
  });
});

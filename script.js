document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const page = {
        init() {
            this.initHeaderScroll();
            this.initMobileMenu();
            this.initMobileAccordion();
        },

        initHeaderScroll() {
            const header = document.getElementById('page-header');
            if (!header) return;

            const scrollThreshold = 20;
            const handleScroll = () => {
                if (window.scrollY > scrollThreshold) {
                    header.classList.add('header-scrolled');
                } else {
                    header.classList.remove('header-scrolled');
                }
            };
            
            window.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll(); // Initial check on load
        },

        initMobileMenu() {
            const menuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (!menuButton || !mobileMenu) return;

            const menuIcon = menuButton.querySelector('i');

            menuButton.addEventListener('click', () => {
                const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';

                mobileMenu.classList.toggle('hidden');
                document.body.classList.toggle('mobile-menu-open');
                menuButton.setAttribute('aria-expanded', String(!isExpanded));

                if (menuIcon) {
                    menuIcon.classList.toggle('fa-bars', isExpanded);
                    menuIcon.classList.toggle('fa-xmark', !isExpanded);
                }
            });
        },

        initMobileAccordion() {
            const dropdownToggles = document.querySelectorAll('.dropdown-toggle-mobile');
            if (dropdownToggles.length === 0) return;

            dropdownToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const currentMenu = toggle.nextElementSibling;
                    const isOpening = currentMenu.classList.contains('hidden');

                    // Close all other accordions first
                    dropdownToggles.forEach(otherToggle => {
                        if (otherToggle !== toggle) {
                            const otherMenu = otherToggle.nextElementSibling;
                            const otherIcon = otherToggle.querySelector('i.fa-chevron-down');
                            
                            if (otherMenu && !otherMenu.classList.contains('hidden')) {
                                otherMenu.classList.add('hidden');
                                if (otherIcon) {
                                    otherIcon.classList.remove('rotate-180');
                                }
                            }
                        }
                    });

                    // Toggle the current accordion
                    if (currentMenu) {
                        currentMenu.classList.toggle('hidden', !isOpening);
                        const currentIcon = toggle.querySelector('i.fa-chevron-down');
                        if (currentIcon) {
                            currentIcon.classList.toggle('rotate-180', isOpening);
                        }
                    }
                });
            });
        }
    };

    page.init();
});
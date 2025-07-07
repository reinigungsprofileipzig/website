document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const page = {
        /**
         * Initialisiert alle Skripte auf der Seite.
         */
        init() {
            this.initHeaderScroll();
            this.initMobileMenu();
            this.initMobileAccordion();
        },

        /**
         * NEU: Optimierte Funktion für den Header beim Scrollen.
         * Diese Version nutzt `requestAnimationFrame`, um DOM-Änderungen (hinzufügen/entfernen von Klassen)
         * außerhalb des kritischen Render-Pfades auszuführen. Das behebt das Problem des
         * "erzwungenen dynamischen Umbruchs" (Forced Synchronous Layout) und verbessert die Performance.
         */
        initHeaderScroll() {
            const header = document.getElementById('page-header');
            if (!header) return;

            const scrollThreshold = 20;
            let isTicking = false; // Flag, um zu verhindern, dass das Skript bei jedem Scroll-Event feuert

            // Die Funktion, die tatsächlich das DOM ändert
            const updateHeader = () => {
                if (window.scrollY > scrollThreshold) {
                    header.classList.add('header-scrolled');
                } else {
                    header.classList.remove('header-scrolled');
                }
                // Animation Frame ist fertig, erlaube den nächsten
                isTicking = false;
            };

            // Der Event-Listener, der bei Scrollen aufgerufen wird
            const handleScroll = () => {
                if (!isTicking) {
                    // Fordere den Browser auf, 'updateHeader' im nächsten Frame auszuführen
                    window.requestAnimationFrame(updateHeader);
                    isTicking = true; // Sperre weitere Aufrufe bis der Frame gezeichnet wurde
                }
            };
            
            window.addEventListener('scroll', handleScroll, { passive: true });
            
            // Führe den initialen Check ebenfalls im nächsten Frame aus, um das erste Rendern nicht zu blockieren.
            handleScroll(); 
        },
        // --- Ende der Änderungen ---


        /**
         * UNVERÄNDERT: Initialisiert die Funktionalität für das mobile Menü (Burger-Button).
         * Dieser Code war bereits performant und musste nicht geändert werden.
         */
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

        /**
         * UNVERÄNDERT: Initialisiert das Akkordeon-Menü für die mobile Ansicht.
         * Dieser Code war bereits performant und musste nicht geändert werden.
         */
        initMobileAccordion() {
            const dropdownToggles = document.querySelectorAll('.dropdown-toggle-mobile');
            if (dropdownToggles.length === 0) return;

            dropdownToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const currentMenu = toggle.nextElementSibling;
                    const isOpening = currentMenu.classList.contains('hidden');

                    // Schließe zuerst alle anderen Akkordeon-Menüs
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

                    // Öffne/Schließe das aktuelle Akkordeon-Menü
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

    // Starte die Initialisierung, nachdem das DOM geladen ist.
    page.init();
});
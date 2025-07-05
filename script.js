document.addEventListener('DOMContentLoaded', function () {

    const header = document.getElementById('page-header');
    if (header) {
        const handleHeaderScroll = () => {
            if (window.scrollY > 10) { 
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        };
        window.addEventListener('scroll', handleHeaderScroll, { passive: true });
        handleHeaderScroll();
    }

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const desktopNavContent = document.getElementById('desktop-nav-content');
    const desktopCtaButtons = document.getElementById('desktop-cta-buttons');
    const body = document.body;
    let isMobileMenuInitialized = false;

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function () {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            
            body.classList.toggle('mobile-menu-open');
            mobileMenu.classList.toggle('hidden');

            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-xmark');

            if (!isMobileMenuInitialized && !mobileMenu.classList.contains('hidden')) {
                const navLinksClone = desktopNavContent.cloneNode(true);
                navLinksClone.id = '';
                navLinksClone.className = 'mobile-nav-links';
                
                const ctaButtonsClone = desktopCtaButtons.cloneNode(true);
                ctaButtonsClone.id = '';
                ctaButtonsClone.className = 'mobile-cta-buttons';

                mobileMenu.appendChild(navLinksClone);
                mobileMenu.appendChild(ctaButtonsClone);
                
                const mobileDropdownToggles = mobileMenu.querySelectorAll('.dropdown-toggle');
                mobileDropdownToggles.forEach(toggle => {
                    toggle.addEventListener('click', function (event) {
                         event.preventDefault(); 
                         this.classList.toggle('is-active');
                         
                         const menu = this.nextElementSibling;
                         if (menu && menu.classList.contains('dropdown-menu')) {
                            if (menu.style.display === 'grid') {
                                menu.style.display = 'none';
                            } else {
                                menu.style.display = 'grid';
                            }
                         }
                    });
                });

                isMobileMenuInitialized = true;
            }
        });
    }
});
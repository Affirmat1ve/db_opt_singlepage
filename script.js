// Navigation functionality
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get target section id from href
            const targetId = link.getAttribute('href').substring(1);
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === targetId) {
                    page.classList.add('active');
                }
            });

            // Update URL without page reload
            history.pushState(null, '', `#${targetId}`);
        });
    });

    // Handle initial page load with hash
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const activeLink = document.querySelector(`[href="#${hash}"]`);
        if (activeLink) {
            activeLink.click();
        }
    }

    // Background color changer (for home page)
    const colorBtn = document.getElementById('colorBtn');
    if (colorBtn) {
        colorBtn.addEventListener('click', () => {
            const colors = ['#f4f4f4', '#e3f2fd', '#f3e5f5', '#e8f5e8'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            document.body.style.backgroundColor = randomColor;
        });
    }

    // Form submission handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Form submitted! (This is a demo)');
            contactForm.reset();
        });
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        if (window.location.hash) {
            const hash = window.location.hash.substring(1);
            const activeLink = document.querySelector(`[href="#${hash}"]`);
            if (activeLink) {
                activeLink.click();
            }
        } else {
            // Default to home
            document.querySelector('[href="#home"]').click();
        }
    });
});
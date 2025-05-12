// Import YouTube video fetching functionality
import { fetchYouTubeVideos } from './youtube-fetch.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get references to menu elements
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = navMenu.querySelectorAll('nav a'); // Get all nav links

    // Toggle menu visibility on button click
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });

    // Hide menu when mouse leaves the menu container
    navMenu.addEventListener('mouseleave', () => {
        navMenu.classList.remove('open');
    });

    // Hide menu when a link is clicked (useful for single page apps)
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
        });
    });

    // Add subtle cat-themed interactions
    const headerCat = document.querySelector('.header-cat');
    if (headerCat) {
        headerCat.addEventListener('mouseover', () => {
            headerCat.style.transform = 'rotate(10deg)';
        });
        headerCat.addEventListener('mouseout', () => {
            headerCat.style.transform = 'rotate(0deg)';
        });
    }

    // Add fade-in animation to all content sections
    const fadeElements = document.querySelectorAll('.section-content, .hero-content, .youtube-intro, .plugin-grid, .project-grid');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(element => {
        element.classList.add('fade-in');
        observer.observe(element);
    });

    // Add page transition effect
    const transitionElement = document.querySelector('.page-transition');
    if (transitionElement) {
        transitionElement.classList.add('active');
        setTimeout(() => {
            transitionElement.classList.remove('active');
        }, 800);
    }

    // Handle navigation transitions
    const navLinksForTransition = document.querySelectorAll('nav a');
    navLinksForTransition.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only handle internal links
            if (this.hostname === window.location.hostname) {
                e.preventDefault();
                const transitionElement = document.querySelector('.page-transition');
                if (transitionElement) { 
                    transitionElement.classList.add('active');
                    
                    setTimeout(() => {
                        window.location.href = this.href;
                    }, 500);
                } else {
                    // If no transition element, just navigate normally
                    window.location.href = this.href;
                }
            }
        });
    });

    // Create paw print trail effect
    let pawContainer = document.querySelector('.cat-trail');
    if (pawContainer) {
        document.addEventListener('mousemove', (e) => {
            // Only create paw prints occasionally
            if (Math.random() > 0.95) {
                const paw = document.createElement('div');
                paw.classList.add('paw-print');
                paw.style.left = e.pageX + 'px';
                paw.style.top = e.pageY + 'px';
                paw.style.transform = `rotate(${Math.random() * 360}deg)`;
                
                pawContainer.appendChild(paw);
                
                // Remove paw print after animation
                setTimeout(() => {
                    paw.remove();
                }, 2000);
            }
        });
    }

    // Plugin search and filtering
    const pluginSearch = document.getElementById('plugin-search');
    const categorySelect = document.getElementById('category-select');
    const pluginCards = document.querySelectorAll('.plugin-card');

    if (pluginSearch && categorySelect) {
        const filterPlugins = () => {
            const searchTerm = pluginSearch.value.toLowerCase();
            const category = categorySelect.value;

            pluginCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                const cardCategory = card.dataset.category;
                
                const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
                const matchesCategory = category === 'all' || cardCategory === category;
                
                if (matchesSearch && matchesCategory) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        };

        pluginSearch.addEventListener('input', filterPlugins);
        categorySelect.addEventListener('change', filterPlugins);
    }

    // Fetch YouTube videos if on YouTube page
    if (document.querySelector('.youtube-page')) {
        fetchYouTubeVideos();
    }

    // Dynamically update the website title in a fun, rotating manner
    const titles = ["Kazen"];
    let index = 0;

    setInterval(() => {
        document.title = titles[index];
        index = (index + 1) % titles.length;
    }, 2000);

    // Animate the title of the page, making 'Kazen' move back and forth fluidly
    const titleElement = document.querySelector('title');
    const baseTitle = "Kazen";
    let position = 0;
    let direction = 1;

    setInterval(() => {
        const spaces = " ".repeat(position);
        titleElement.textContent = `${spaces}${baseTitle}`;

        if (position === 10 || position === 0) {
            direction *= -1;
        }
        position += direction;
    }, 200);
});

// Agregar animación dinámica al título del navegador
(function animateTitle() {
    const title = "Kazen";
    let direction = 1; // 1 para mover hacia la derecha, -1 para mover hacia la izquierda
    let position = 0;

    setInterval(() => {
        // Crear un espacio dinámico para simular el movimiento
        const spaces = " ".repeat(position);
        document.title = spaces + title;

        // Cambiar la dirección si llega al límite
        if (position >= 10) direction = -1;
        if (position <= 0) direction = 1;

        // Actualizar la posición
        position += direction;
    }, 200); // Cambiar cada 200ms para un movimiento fluido
})();
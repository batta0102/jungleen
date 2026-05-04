import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar.component';

/**
 * Frontend Layout Component
 * Displays the user-facing frontend with navbar
 */
@Component({
  selector: 'app-front-layout',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, RouterLink],
  template: `
    <div class="frontend-layout">
      <app-navbar />
      
      <main class="app-main" id="main">
        <router-outlet />
      </main>

      <footer class="app-footer">
        <div class="container footer-top">
          <div class="footer-left">
            <div class="brand footer-brand">Jungle in English</div>
            <div class="muted footer-tagline">𝗧𝗵𝗲 𝗲𝘅𝗽𝗲𝗿𝘁 𝗶𝗻 𝗮𝗻𝘆𝘁𝗵𝗶𝗻𝗴 𝘄𝗮𝘀 𝗼𝗻𝗰𝗲 𝗮 𝗯𝗲𝗴𝗶𝗻𝗻𝗲𝗿</div>

            <div class="footer-contact" aria-label="Contact information">
              <div class="footer-contact-line">
                <span class="footer-contact-label muted">Phone:</span>
                <a class="footer-link" href="tel:+21694190843">+216 94 190 843</a>
              </div>
              <div class="footer-contact-line">
                <span class="footer-contact-label muted">Email:</span>
                <a class="footer-link" href="mailto:jungleinenglish@gmail.com">jungleinenglish@gmail.com</a>
              </div>
              <div class="footer-contact-line">
                <span class="footer-contact-label muted">Linktree:</span>
                <a
                  class="footer-link"
                  href="https://linktr.ee/jungleinenglish?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnoB2lto3Ga27lkDii1XUNOELd4LW3oHywkWE9eL4d_dbiTI5GF0dAAt_jg8I_aem_oDppELCegX3lR3ItC1fcQw"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  linktr.ee/jungleinenglish
                </a>
              </div>
            </div>

            <div class="footer-social" aria-label="Social links">
              <a
                class="social-btn"
                href="https://www.tiktok.com/@jungle.in.english"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M14.5 3c.4 2.9 2.2 4.8 5 5.1V11c-2-.1-3.7-.8-5-2v7.1c0 3.1-2.6 5.9-6.2 5.9-3.4 0-6.3-2.5-6.3-6.2 0-3.7 2.9-6.2 6.3-6.2.4 0 .8 0 1.2.1v3.2c-.4-.1-.7-.2-1.2-.2-1.6 0-3 1.1-3 3.1 0 1.9 1.4 3.1 3 3.1 1.9 0 3.2-1.2 3.2-3.7V3h3z"
                  />
                </svg>
              </a>
              <a
                class="social-btn"
                href="https://www.instagram.com/jungleinenglish/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M7.5 3.5h9A4 4 0 0 1 20.5 7.5v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4zm0 2A2 2 0 0 0 5.5 7.5v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-9z"
                  />
                  <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                  <path d="M17.2 6.7a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0z" />
                </svg>
              </a>
              <a
                class="social-btn"
                href="https://www.linkedin.com/company/jungle-in-english/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M6.8 10.2H4.2V20h2.6v-9.8zM5.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
                  />
                  <path
                    d="M20 20h-2.6v-5.2c0-1.3-.5-2.1-1.6-2.1-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V20H11.2v-9.8h2.6v1.3c.4-.6 1.2-1.5 2.8-1.5 2 0 3.4 1.3 3.4 4.1V20z"
                  />
                </svg>
              </a>
              <a
                class="social-btn"
                href="https://www.facebook.com/jungleinenglish/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M13.7 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.9v1.9H8.2V14h2.5v7h3z"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div class="footer-right">
            <div class="footer-col-title">Useful links</div>
            <nav class="footer-links" aria-label="Useful links">
              <a class="footer-nav-link" routerLink="/front/trainings">Trainings</a>
              <a class="footer-nav-link" routerLink="/front/events">Events</a>
              <a class="footer-nav-link" routerLink="/front/clubs">Clubs</a>
              <a class="footer-nav-link" [routerLink]="['/front']" fragment="testimonials">Testimonials</a>
              <a class="footer-nav-link" [routerLink]="['/front']" fragment="instructors">Instructors</a>
              <a class="footer-nav-link" [routerLink]="['/front']" fragment="contact">Contact</a>
            </nav>
          </div>
        </div>

        <div class="container footer-bottom">
          <div class="muted">© {{ currentYear }} Jungle in English. All rights reserved.</div>
        </div>
      </footer>
    </div>
  `,
  styles: []
})
export class FrontLayoutComponent {
  protected readonly currentYear = new Date().getFullYear();
}

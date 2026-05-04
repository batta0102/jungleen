import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="app-footer">
      <div class="container footer-top">
        <div class="footer-left">
          <div class="brand footer-brand">Jungle in English</div>
          <div class="muted footer-tagline">The expert in anything was once a beginner</div>

          <div class="footer-contact" aria-label="Contact information">
            <div class="footer-contact-line">
              <span class="footer-contact-label muted">Phone:</span>
              <a class="footer-link" href="tel:+21694190843">+216 94 190 843</a>
            </div>
            <div class="footer-contact-line">
              <span class="footer-contact-label muted">Email:</span>
              <a class="footer-link" href="mailto:jungleinenglish@gmail.com">jungleinenglish@gmail.com</a>
            </div>
          </div>

          <div class="footer-social" aria-label="Social links">
            <a class="social-btn" href="https://www.tiktok.com/@jungle.in.english" target="_blank" rel="noopener noreferrer" aria-label="TikTok">TikTok</a>
            <a class="social-btn" href="https://www.instagram.com/jungleinenglish/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">Instagram</a>
            <a class="social-btn" href="https://www.linkedin.com/company/jungle-in-english/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a>
            <a class="social-btn" href="https://www.facebook.com/jungleinenglish/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">Facebook</a>
          </div>
        </div>

        <div class="footer-right">
          <div class="footer-col-title">Useful links</div>
          <nav class="footer-links" aria-label="Useful links">
            <a class="footer-nav-link" routerLink="/front/trainings">Trainings</a>
            <a class="footer-nav-link" routerLink="/front/events">Events</a>
            <a class="footer-nav-link" routerLink="/clubs">Clubs</a>
            <a class="footer-nav-link" [routerLink]="['/front']" fragment="contact">Contact</a>
          </nav>
        </div>
      </div>

      <div class="container footer-bottom">
        <div class="muted">Copyright {{ currentYear }} Jungle in English. All rights reserved.</div>
      </div>
    </footer>
  `,
  styles: []
})
export class FooterComponent {
  protected readonly currentYear = new Date().getFullYear();
}

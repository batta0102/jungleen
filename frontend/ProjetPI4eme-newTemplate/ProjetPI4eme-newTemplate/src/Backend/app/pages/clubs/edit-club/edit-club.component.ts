import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClubService, Club } from '../../../services/club.service';

@Component({
  selector: 'app-edit-club',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './edit-club.component.html',
  styleUrls: ['./edit-club.component.scss']
})
export class EditClubComponent implements OnInit {
  club: Club = {
    nom: '',
    description: '',
    niveau: 'BEGINNER',
    capacityMax: 0,
    clubOwner: '',
    dateCreation: new Date(),
    status: 'ACTIVE'
  };
  
  errorMessage: string | null = null;
  clubId: number | null = null;

  niveaux = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clubService: ClubService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.clubId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.clubId) {
      this.loadClub();
    }
  }

  loadClub(): void {
    console.log('🚀 loadClub called - clubId:', this.clubId);
    
    if (!this.clubId) {
      console.log('❌ No clubId provided');
      return;
    }
    
    console.log('📥 Starting to load club...');
    this.errorMessage = null;
    
    // Forcer la détection de changement
    this.cdr.detectChanges();
    
    // Utiliser directement getAllClubs qui fonctionne déjà dans clubs.component
    this.clubService.getAllClubs().subscribe({
      next: (clubs: any[]) => {
        console.log('✅ Clubs loaded from API:', clubs);
        console.log('🔍 Looking for club with ID:', this.clubId);
        
        const club = clubs.find(c => c.idClub === this.clubId);
        console.log('🎯 Found club:', club);
        
        if (club) {
          this.club = {
            ...club,
            dateCreation: club.dateCreation ? new Date(club.dateCreation) : new Date()
          };
          console.log('✅ Club data assigned:', this.club);
        } else {
          console.log('❌ Club not found in list');
          this.errorMessage = `Club with ID ${this.clubId} not found`;
        }
        

        
        // Forcer la mise à jour du template
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading clubs:', error);
        this.errorMessage = 'Error loading club data: ' + error.message;
        this.cdr.detectChanges();
      }
    });
  }

  updateClub(): void {
    if (!this.clubId || !this.club.nom || !this.club.description) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.errorMessage = null;

    console.log('📤 Sending PUT request to:', `/api/clubs/${this.clubId}`);
    console.log('📤 Club data:', this.club);

    // Utiliser uniquement PUT de base
    this.clubService.updateClub(this.clubId, this.club).subscribe({
      next: (response) => {
        console.log('✅ Club updated successfully:', response);
        this.router.navigate(['/back/clubs']);
      },
      error: (error) => {
        console.error('❌ Error updating club:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ URL:', error.url);
        this.errorMessage = `Error updating club (${error.status}): ${error.message || 'Unknown error'}`;

      }
    });
  }

  cancel(): void {
    this.router.navigate(['/back/clubs']);
  }
}

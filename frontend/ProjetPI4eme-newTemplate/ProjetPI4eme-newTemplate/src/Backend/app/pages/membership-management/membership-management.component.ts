import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MembershipService, ClubMembership } from '../../../../Frontend/app/services/membership';
import { MembershipSyncService } from '../../../../Frontend/app/services/membership-sync.service';

@Component({
  selector: 'app-membership-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './membership-management.component.html',
  styleUrls: ['./membership-management.component.scss']
})
export class MembershipManagementComponent implements OnInit {
  private router = inject(Router);
  private membershipService = inject(MembershipService);
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(MembershipSyncService);

  pendingMemberships: ClubMembership[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    this.loadPendingMemberships();
  }

  loadPendingMemberships(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    console.log('🔍 Début chargement des adhésions...');
    console.log('🌐 URL API:', this.membershipService['apiUrl']);
    
    // Appel API pour récupérer toutes les adhésions
    this.membershipService.getAllMemberships().subscribe({
      next: (data: ClubMembership[]) => {
        console.log('✅ Données reçues du backend:', data);
        this.pendingMemberships = data.filter((m: ClubMembership) => m.status === 'EN_ATTENTE');
        console.log('🔍 Demandes filtrées (EN_ATTENTE):', this.pendingMemberships);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des adhésions:', error);
        this.errorMessage = 'Impossible de charger les demandes d\'adhésion';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Solution 2: Appel direct au backend (fallback)
  private loadDirectFromBackend(): void {
    const directUrl = '/api/memberships/user/1'; // Utiliser le proxy
    console.log('🌐 URL directe:', directUrl);
    
    // Créer un appel HTTP direct
    const xhr = new XMLHttpRequest();
    xhr.open('GET', directUrl, true);
    xhr.withCredentials = false;
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          console.log('✅ Succès appel direct:', data);
          this.pendingMemberships = data.filter((m: ClubMembership) => m.status === 'EN_ATTENTE');
          this.isLoading = false;
        } else {
          console.error('❌ Erreur appel direct:', xhr.status, xhr.statusText);
          this.errorMessage = `Erreur ${xhr.status}: ${xhr.statusText}`;
          this.isLoading = false;
        }
      }
    };
    xhr.onerror = (error) => {
      console.error('❌ Erreur réseau:', error);
      this.errorMessage = 'Erreur de connexion au backend';
      this.isLoading = false;
    };
    xhr.send();
  }

  acceptMembership(membership: ClubMembership): void {
    console.log('✅ Accepter membership:', membership);
    this.updateMembershipStatus(membership, 'VALIDEE');
  }

  rejectMembership(membership: ClubMembership): void {
    console.log('❌ Refuser membership:', membership);
    this.updateMembershipStatus(membership, 'REFUSEE');
  }

  private updateMembershipStatus(membership: ClubMembership, newStatus: string): void {
    console.log(`🔄 Mise à jour du statut: ${membership.idInscription} -> ${newStatus}`);
    
    // Mettre à jour le statut dans l'objet
    membership.status = newStatus as 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE';
    
    // Appeler l'API pour mettre à jour en base
    this.membershipService.updateMembershipStatus(membership).subscribe({
      next: (response: ClubMembership) => {
        console.log('✅ Mise à jour réussie:', response);
        
        // Retirer de la liste des demandes en attente si validée/refusée
        const index = this.pendingMemberships.findIndex(m => m.idInscription === membership.idInscription);
        if (index !== -1 && newStatus !== 'EN_ATTENTE') {
          this.pendingMemberships.splice(index, 1);
          console.log('📋 Demandes restantes:', this.pendingMemberships);
        }
        
        // Notifier le front du changement de statut
        this.syncService.notifyMembershipUpdate(
          membership.idInscription!, 
          newStatus as 'VALIDEE' | 'REFUSEE'
        );
        
        // Afficher le message de succès
        this.successMessage = `Demande ${newStatus === 'VALIDEE' ? 'acceptée' : 'refusée'} avec succès`;
        
        // Masquer le message après 3 secondes
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
        
        // Forcer la détection de changements
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de la mise à jour:', error);
        this.errorMessage = 'Erreur lors de la mise à jour du statut';
        this.cdr.detectChanges();
      }
    });
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'VALIDEE': return 'Validée';
      case 'REFUSEE': return 'Refusée';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-800';
      case 'VALIDEE': return 'bg-green-100 text-green-800';
      case 'REFUSEE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  goBackToClubs(): void {
    this.router.navigate(['/back/clubs']);
  }
}

import { Component, ViewChild } from '@angular/core';
import { MfilesService } from '../../services/mfiles.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginRequest = {
    Username: '',
    Password: '',
    VaultGuid: '',
    BaseUrl: ''
  };
  authToken: string = ''; // Default to an empty string.
  showToast = false;
  toastTitle = '';
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';
  @ViewChild('toast') toastComponent!: ToastComponent;

  showCustomToast(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 4000);
  }

  constructor(private mfilesService: MfilesService, private router: Router) { }
 login() {
  const baseUrl = this.loginRequest.BaseUrl?.trim(); // ✅ Extraire au début et nettoyer
  if (!baseUrl) {
    this.showCustomToast('Erreur', 'Base URL manquante.', 'error');
    return;
  }

  this.mfilesService.login(this.loginRequest).subscribe(
    (response: any) => {
      console.log('Login Response:', response);

      const token = response.token || response.Value || response.authToken || response; // Dans ton cas le backend renvoie juste un `string`
      if (!token) {
        this.showCustomToast('Erreur', 'Token d\'authentification manquant.', 'error');
        return;
      }

localStorage.setItem('authToken', token); // Pas de JSON.stringify()
      localStorage.setItem('baseUrl', baseUrl);
      localStorage.setItem('loginRequest', JSON.stringify(this.loginRequest));

      this.router.navigate(['/dashboard']);
    },
    (error) => {
      console.error('Login failed', error);

      let message = 'Une erreur inconnue est survenue.';
      if (error.status === 401) {
        message = 'Nom d’utilisateur ou mot de passe invalide.';
      } else if (error.status === 403) {
        message = 'Accès refusé.';
      } else if (error.status === 0) {
        message = 'Impossible de se connecter au serveur.';
      }

      this.showCustomToast('Échec de connexion', message, 'error');
    }
  );
}


}

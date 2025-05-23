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
    this.mfilesService.login(this.loginRequest).subscribe(
      (response: any) => {
        console.log('Login Response:', response);

        // Extract token and baseUrl
        this.authToken = response.token || response.Value || response.authToken || null;
        const Username = this.loginRequest.Username || ''; // Use the entered BaseUrl
        const VaultGuid = this.loginRequest.VaultGuid || ''; // Use the entered BaseUrl
        const baseUrl = this.loginRequest.BaseUrl || ''; // Use the entered BaseUrl

        if (this.authToken && baseUrl) {
          localStorage.setItem('authToken', JSON.stringify(this.authToken));
          localStorage.setItem('baseUrl', baseUrl); // ✅ Store Base URL
          localStorage.setItem('loginRequest', JSON.stringify(this.loginRequest)); // ✅ AJOUT ICI


          this.router.navigate(['/dashboard']);
        } else {
          console.error('Auth token or Base URL is missing:', response);
        }
      },
      (error) => {
        console.error('Login failed', error);

        let title = 'Authentication Failed';
        let message = 'An unexpected error occurred.';

        if (error.status === 401) {
          message = 'Invalid username or password.';
        } else if (error.status === 403) {
          message = 'Access denied. Check your Vault GUID or user permissions.';
        } else if (error.status === 0) {
          message = 'Unable to connect to the server. Please check your Base URL.';
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.';
        }

        this.showCustomToast(title, message, 'error');
      }

    );
  }


}

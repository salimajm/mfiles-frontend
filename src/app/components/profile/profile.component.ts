import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userProfile = {
    Username: '',
    BaseUrl: '',
    Password: '',

    VaultGuid: '',
    AuthToken: ''
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load user data from localStorage
    this.userProfile.BaseUrl = localStorage.getItem('baseUrl') || '';
    this.userProfile.AuthToken = JSON.parse(localStorage.getItem('authToken') || '""');
    this.userProfile.Password = JSON.parse(localStorage.getItem('Password') || '""');

    // If you saved other user info like Username or VaultGuid, get them here
    const storedLogin = JSON.parse(localStorage.getItem('loginRequest') || '{}');
    this.userProfile.Username = storedLogin.Username || '';
    this.userProfile.VaultGuid = storedLogin.VaultGuid || '';
    this.userProfile.Password = storedLogin.Password || '';

  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
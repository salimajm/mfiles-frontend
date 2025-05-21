import { Component } from '@angular/core';
import { MfilesService } from '../../services/mfiles.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  constructor(private mfiles: MfilesService, private router: Router) {}
  isSidebarCollapsed = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  onLogout(): void {
    this.mfiles.logout();
    this.router.navigate(['/login']); // Navigate to the login page after logout

  }
}

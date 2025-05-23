import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-toast',  standalone: false,

 template: `
    <div *ngIf="visible" class="custom-toast" [ngClass]="type">
      <div class="icon">
        <i [ngClass]="getIconClass(type)"></i>
      </div>
      <div class="text">
        <strong>{{ title }}</strong>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .custom-toast {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1050;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      min-width: 300px;
      max-width: 400px;
      background: white;
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: fadeSlide 0.3s ease-out;
    }

    .custom-toast.success { border-left: 5px solid #28a745; }
    .custom-toast.error   { border-left: 5px solid #dc3545; }
    .custom-toast.info    { border-left: 5px solid #17a2b8; }
    .custom-toast.warning { border-left: 5px solid #ffc107; }

    .custom-toast .icon i {
      font-size: 20px;
      margin-top: 3px;
    }

    .custom-toast.success .icon i { color: #28a745; }
    .custom-toast.error .icon i   { color: #dc3545; }
    .custom-toast.info .icon i    { color: #17a2b8; }
    .custom-toast.warning .icon i { color: #ffc107; }

    .custom-toast .text strong {
      font-size: 14px;
      color: #333;
    }

    .custom-toast .text p {
      font-size: 13px;
      color: #555;
      margin: 2px 0 0;
    }

    @keyframes fadeSlide {
      from { opacity: 0; transform: translate(-50%, -10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `]
})
export class ToastComponent {
  @Input() title = '';
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' | 'warning' = 'info';
  visible = false;

  show(duration = 3000) {
    this.visible = true;
    setTimeout(() => (this.visible = false), duration);
  }
  getIconClass(type: string): string {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-times-circle';
      case 'warning': return 'fas fa-exclamation-circle';
      default: return 'fas fa-info-circle';
    }
  }
}

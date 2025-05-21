import { Component, Input, OnChanges } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-share-dialog',
  standalone: false,
  templateUrl: './share-dialog.component.html',
  styleUrl: './share-dialog.component.css'
})
export class ShareDialogComponent  implements OnChanges{
  @Input() visible = false;
  @Input() shareLink = '';
  @Input() chatHistory: { sender: 'user' | 'bot', text: string }[] = [];

  fullExportLink = '';

  ngOnChanges() {
    this.generateLink();
  }

  generateLink() {
    if (!this.chatHistory || this.chatHistory.length === 0) {
      this.fullExportLink = `${this.shareLink}?chat=`;
      return;
    }

    const plainText = this.chatHistory.map(m =>
      `${m.sender === 'user' ? '👤 Vous' : '🤖 M-Files BOT'}: ${m.text}`
    ).join('\n---\n');

    const encoded = btoa(unescape(encodeURIComponent(plainText))); // Base64 encoding
    this.fullExportLink = `${this.shareLink}?chat=${encoded}`;
  }

  copyLink() {
    navigator.clipboard.writeText(this.fullExportLink).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Copied to clipboard!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    });
  }
}

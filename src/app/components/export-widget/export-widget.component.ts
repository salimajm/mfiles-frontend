import { Component, Input } from '@angular/core';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-export-widget',
  standalone: false,
  templateUrl: './export-widget.component.html',
  styleUrl: './export-widget.component.css'
})
export class ExportWidgetComponent {
  isOpen = false;
  isExporting = false;
  exportingType = '';
  progress = 0;
  range = 'all';
  @Input() targetSelector = '.messages-container'; // Par défaut

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  exportAsPng() {
    const element = document.querySelector(this.targetSelector) as HTMLElement;
    if (!element) {
      alert("❌ Zone de chat introuvable.");
      this.isExporting = false;
      return;
    }

    this.exportingType = 'png';
    this.isExporting = true;
    this.progress = 10;

    html2canvas(element, {
      scale: 2,
      useCORS: true
    }).then(canvas => {
      this.progress = 80;

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `conversation_${new Date().toISOString()}.png`;
      link.click();

      this.progress = 100;
      setTimeout(() => this.isExporting = false, 1000);
    }).catch(error => {
      console.error("Erreur export PNG:", error);
      this.isExporting = false;
    });
  }

  export(type: string) {
    this.isOpen = false;
    this.exportingType = type;
    this.isExporting = true;
    this.progress = 0;

    const interval = setInterval(() => {
      if (this.progress < 95) {
        this.progress += 5;
      }
    }, 200);

    // Simulate async export
    setTimeout(() => {
      clearInterval(interval);
      this.progress = 100;
      setTimeout(() => this.isExporting = false, 1000);

      // Replace with actual export logic
      this.performExport(type);
    }, 3000);
  }
  fileName = '';
cancelExport() {
  this.isExporting = false;
  this.progress = 0;
  this.exportingType = '';
}

 performExport(type: string) {
    const element = document.querySelector(this.targetSelector) as HTMLElement;

    if (!element) {
      alert("❌ Zone introuvable");
      return;
    }

 const base = 'ChatDOC_[SAMPLE] Collection_QA';
const timestamp = new Date().toISOString();

if (type === 'png') {
  this.fileName = `${base}.png`;
  html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = this.fileName;
    link.click();
  });
} else if (type === 'markdown') {
  this.fileName = `${base}.md`;
  const markdown = this.convertToMarkdown(element.innerText);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  this.downloadBlob(blob, this.fileName);
} else if (type === 'html') {
  this.fileName = `${base}.html`;
  const html = `<html><body>${element.innerHTML}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  this.downloadBlob(blob, this.fileName);
}

  }

  convertToMarkdown(text: string): string {
    return text
      .replace(/^M‑Files BOT/gm, '🤖 **M‑Files BOT**')
      .replace(/^Vous/gm, '👤 **Vous**')
      .replace(/\n{2,}/g, '\n\n');
  }

  downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metadata-viewer',
  standalone: false,
  templateUrl: './metadata-viewer.component.html',
  styleUrl: './metadata-viewer.component.css'
})
export class MetadataViewerComponent {
 @Input() document: any;
  @Input() showAllMetadata: boolean = false;

  toggleMetadata(): void {
    this.showAllMetadata = !this.showAllMetadata;
  }

  getMetadataValue(key: string): string {
    const entry = this.document?.metadata?.find((entry: [string, string]) => entry[0] === key);
    return entry ? entry[1] : '---';
  }

  visibleMetadata(): [string, string][] {
    const metadata = this.document?.metadata || [];
    return this.showAllMetadata ? metadata : metadata.slice(0, 13);
  }
}

import { ChangeDetectorRef, Component, HostListener, Input, OnInit } from '@angular/core';
import { MfilesService } from '../../services/mfiles.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatbotService } from '../../services/chatbot.service';
import { HttpEvent, HttpEventType } from '@angular/common/http'; // Assure-toi d'importer ça !

interface Tab {
  id: string;
  label: string;
  icon?: string; // icon est optionnel
}


@Component({
  selector: 'app-projects',
  standalone: false,
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']

})
export class ProjectsComponent implements OnInit {

  objectTypes: any[] = [];
  selectedObjectTypeId: number | null = null;

  projects: any;
  documents: any;
  authToken: string = '';
  selectedProjectId: number | undefined;
  documentUrl!: SafeResourceUrl;
  isDocumentOpen: boolean = false;
  selectAll: boolean = false;
  page: number = 1;
  totalPages: number = 0;
  itemsPerPage: number = 5;
  objectType!: number;
  question: string = '';
  answer: string = '';
  selectedDocument: any;
  isChatbotOpen = false;  // État pour afficher ou masquer le chatbot
  selectedTab: Tab = { id: 'metadata', label: 'Metadata', icon: '🗂️' };

  tabs: Tab[] = [
    { id: 'metadata', label: 'Metadata', icon: '🗂️' },
    { id: 'preview', label: 'Preview', icon: '👁️' },
    { id: 'filters', label: 'Filters', icon: '🔎' },
    { id: 'aiinfo', label: 'M‑Files BOT', icon: '🤖' }
  ];

  previewHtml!: string;
  isFileUploaded = false;
  isWidgetChatOpen = false;
  hovered: boolean = false;
  loading = false;
  isPaging = false;
  pageProgress = 0;
  rawBlobUrl: string | null = null;
  previewUrl: SafeResourceUrl | null = null;
  errorMessage = '';
  isOfficeType = false;
  loadingProgress = 0;
  @Input() documentId!: number;
  @Input() documentTitle!: string;
  loadingTimeout = false;
  isOpen = true;
  messages: {
    feedback: any; sender: 'user' | 'bot', text: string
  }[] = [];
  isLoading = false;
  isMinimized = false;
  isRecording = false;
  mediaRecorder!: MediaRecorder;
  audioChunks: any[] = [];
  showWelcomeMessage: boolean = true;
  showAllMetadata = false;
  selectedDocumentType: any;
  selectedProjectName: string = '';
  propertyDefId: number = 1060; // ou la valeur correcte selon ton système M-Files
  chatHistory: any[] = [];
  filterQuery = '';
  valueFilterQuery = '';
  selectedModificationRange = 'any';
  selectedUser = '';
  selectedDocType = '';
  analysisResult: {
    links: string[];
    similarDocs: { filename: string; similarity_score: number }[];
  } | null = null;
  isChatClosed = false;
  modificationOptions = [
    { label: 'Toutes', value: 'any' },
    { label: '24h', value: '24h' },
    { label: '7j', value: '7d' },
    { label: '30j', value: '30d' },
    { label: '1 an', value: '365d' }
  ];
  modelDropdownOpen = false;

  models: string[] = ['deepseek-r1:1.5b', 'mistral:instruct', 'gemma:2b'];

  availableDocTypes = ['PDF', 'Word', 'Excel', 'PowerPoint', 'docx', 'xlsx'];
  availableUsers: string[] = [];
  chatHistoryVisible = false;
  availableDates: string[] = [];
  selectedModel: string = 'deepseek-r1:1.5b'; // <- Tiny est sélectionné par défaut


  constructor(private cdr: ChangeDetectorRef, private mfilesService: MfilesService, private chatbotService: ChatbotService, private router: Router, private cdRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer, private http: HttpClient
  ) { }
  openChatbotFromButton(): void {
    this.selectedTab = this.tabs.find(tab => tab.id === 'aiinfo')!;
    this.isChatbotOpen = true;
    this.isMinimized = false;
    this.isChatClosed = false;
    this.showWelcomeMessage = true;
  }
isFullScreen: boolean = false;

toggleFullScreenChatbot() {
  this.isFullScreen = !this.isFullScreen;
}

  ngOnInit(): void {
    this.authToken = JSON.parse(localStorage.getItem('authToken') || '""');
    this.baseUrl = localStorage.getItem('baseUrl') || '';
    this.getObjectTypes(); // 🆕


  }
  getObjectTypes(): void {
    this.mfilesService.getObjectTypes(this.authToken, this.baseUrl).subscribe({
      next: (data) => {
        console.log('✔️ ObjectTypes reçus :', data);
        this.objectTypes = data || [];
      },
      error: (err) => {
        console.error("❌ Erreur de chargement des Object Types :", err);
      }
    });
  }

  selectedObjectTypeName: string = '';

  onObjectTypeChange(): void {
    const selected = this.objectTypes.find(t => t.ID === this.selectedObjectTypeId);
    this.selectedObjectTypeName = selected?.Name || '';

    if (!this.selectedObjectTypeId) return;

    this.mfilesService.getProjectsByObjectType(this.authToken, this.baseUrl, this.selectedObjectTypeId).subscribe({
      next: (data) => {
        this.projects = data.Items || [];
        this.selectedProjectId = undefined;
        this.documents = null;
      },
      error: (err) => {
        console.error("Erreur lors de la récupération des projets :", err);
      }
    });
  }


  onModelChange() {
    console.log('Modèle sélectionné :', this.selectedModel);
  }

  selectModel(model: string) {
    this.selectedModel = model;
    this.modelDropdownOpen = false;
  }

  getModelIcon(model: string | null): string {
    switch (model) {
      case 'deepseek-r1:1.5b':
        return 'https://res.cloudinary.com/ds6qxoyjg/image/upload/v1747070149/nasfgki7eparfncvlfnt.png';
      case 'mistral:instruct':
        return 'https://res.cloudinary.com/ds6qxoyjg/image/upload/v1747082616/ckw5mn7lxymsoap4s5r0.png';
      case 'gemma:2b':
        return 'https://res.cloudinary.com/ds6qxoyjg/image/upload/v1747085639/nz8srmxsjq07h9o72h6z.jpg'; // ou autre image personnalisée
      default:
        return '';
    }
  }


  openHistory(): void {
    this.chatHistoryVisible = !this.chatHistoryVisible;
    if (this.chatHistoryVisible) {
      this.chatbotService.getHistory().subscribe({
        next: (data) => {
          this.chatHistory = data;
        },
        error: (err) => {
          console.error('Erreur lors du chargement de l’historique :', err);
        }
      });
    }
  }


  resetFilters(): void {
    this.filterQuery = '';
    this.valueFilterQuery = '';
    this.selectedModificationRange = 'any';
    this.selectedUser = '';
    this.selectedDocType = '';
  }


  initializeFilterOptions(): void {
    const metadata = this.selectedDocument?.metadata;
    if (!metadata) return;

    // Récupère les noms d'utilisateur uniquement depuis "Modifié par"
    this.availableUsers = Array.from(new Set(
      metadata
        .filter(([key, _]: [string, string]) => key === 'Modifié par')
        .map(([_, value]: [string, string]) => value)
    )) as string[];

    // Récupère les extensions à partir du titre du document
    const title = this.selectedDocument.Title || '';
    const extMatch = title.match(/\.(\w+)$/);
    this.availableDocTypes = extMatch ? [extMatch[1].toUpperCase()] : [];

    // Récupère toutes les métadonnées de type date (créé, modifié…)
    this.availableDates = metadata
      .filter(([key, _]: [string, string]) =>
        key.toLowerCase().includes('créé') || key.toLowerCase().includes('modification')
      )
      .map(([key, value]: [string, string]) => `${key}: ${value}`);
  }


  get filteredMetadata(): [string, string][] {
    if (!this.selectedDocument?.metadata) return [];

    const nameQuery = this.filterQuery.toLowerCase();
    const valueQuery = this.valueFilterQuery.toLowerCase();

    return this.selectedDocument.metadata.filter((entry: [any, any]) => {
      const [key, value] = entry;
      const matchesName = nameQuery ? key?.toLowerCase().includes(nameQuery) : true;
      const matchesValue = valueQuery ? (value?.toLowerCase?.().includes(valueQuery)) : true;
      return matchesName && matchesValue;
    });
  }

  askQuestion(document: any): void {
    this.selectedDocument = document;  // Sauvegarder le document sélectionné
    this.isChatbotOpen = true;  // Ouvrir le chatbot

  }

  onFileUploaded() {
    this.isFileUploaded = true;
  }
  openWidgetChat() {
    if (!this.isFileUploaded) return; // Ignore clic si pas de fichier
    this.isWidgetChatOpen = true;
  }

  closeWidgetChat() {
    this.isWidgetChatOpen = false;
  }

  changeTab(tab: any): void {
    this.selectedTab = tab;

    if (tab.id === 'preview' && this.selectedDocument) {
      console.log('[Tab] Ouverture de la prévisualisation...');
      this.openDocumentForPreview(this.selectedDocument.ObjVer.ID, this.selectedDocument.ObjVer.Version);
    }
    if (tab.id === 'aiinfo') {
      this.isChatbotOpen = true;
      this.isChatClosed = false; // ← ajoute ça ici si tu veux l'ouvrir sans le reset

      this.resetChatbot();  // Reset the chatbot when switching to AI Info

    } else {
      this.isChatbotOpen = false;
    }
  }
  trackByDocId(index: number, doc: any): number {
    return doc.ID;
  }
  sanitize(text: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }
  selectDocument(doc: any) {
    const objectId = doc.ID || doc.ObjVer?.ID;
    const objectType = doc.ObjVer?.Type;

    if (!objectId || (objectType === undefined || objectType === null)) {
      console.error('❌ Document invalide sélectionné. ID ou Type manquants.');
      this.selectedDocument = null;
      return;
    }

    this.loading = true; // 🔄 Affiche spinner global
    this.selectedDocument = doc;
    this.analysisResult = null;
    this.selectedTab = this.tabs.find(tab => tab.id === 'metadata')!;
    this.getDocumentMetadata(objectType, objectId);
    this.resetChatbot();
    this.initializeFilterOptions();

    console.log('📄 Téléchargement du document :', objectId, objectType);

    this.mfilesService.downloadDocument(this.authToken, this.baseUrl, objectId, doc.ObjVer.Version).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          const blob = event.body as Blob;
          const realFile = new File([blob], doc.Title, { type: blob.type });

          // ✅ Associer le fichier téléchargé au document sélectionné
          this.selectedDocument.file = realFile;
          this.selectedDocument.name = doc.Title;

          // ✅ Ajout message de confirmation
          this.messages.push({
            sender: 'user',
            text: `📄 Fichier "${doc.Title}" envoyé.`,
            feedback: null
          });

          this.isDocumentSelected = true;

          // ✅ Initialisation RAG côté backend
          this.initializeFile();
        }
      },
      error: (err) => {
        console.error('❌ Erreur lors du téléchargement du document :', err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }


  onMouseEnter() {
    this.hovered = true;
  }

  onMouseLeave() {
    this.hovered = false;
  }

  selectProject(project: any): void {
    if (!project || !project.ID) {
      console.error('Invalid project selected:', project);
      return;
    }

    this.selectedProjectId = project.ID;
    console.log('Selected Project ID:', this.selectedProjectId);
    this.getDocumentsByProject();
  }

  onProjectChange() {
    this.loading = true;
    // fetch…
    // une fois reçu :
    this.loading = false;
  }

  onPageChange(page: number) {
    this.isPaging = true;
    this.pageProgress = 0;
    // simuler ou incrémenter pageProgress pendant la requête
    // à la fin : this.pageProgress = 100; this.isPaging = false;
  }


  toggleSelectAll() {
    if (this.selectAll) {
      this.documents.Items.forEach((document: any) => document.selected = true);
    } else {
      this.documents.Items.forEach((document: any) => document.selected = false);
    }
  }
  getProjects(): void {
    if (this.authToken && this.baseUrl) {
      this.mfilesService.getProjects(this.authToken, this.baseUrl).subscribe(
        (response) => {
          console.log('Projects Response:', response);
          this.projects = response.Items || [];
          console.log('Projects:', this.projects);
        },
        (error) => {
          console.error('Failed to fetch projects:', error);
        }
      );
    }
  }

  getDocumentsByProject(): void {
    if (this.selectedProjectId === undefined || this.selectedProjectId === null) {
      console.error('ID du projet non sélectionné');
      return;
    }

    console.log(`Récupération des documents pour le projet ID=${this.selectedProjectId}, propID=${this.propertyDefId}`);

    this.mfilesService
      .getProjectDocumentsById(this.authToken, this.baseUrl, this.propertyDefId, this.selectedProjectId)
      .subscribe(
        (response) => {
          console.log('Documents liés au projet :', response);
          this.documents = response; // On garde tout l'objet
        },
        (error) => {
          console.error('Erreur lors de la récupération des documents :', error);
        }
      );
  }



  downloadDocument(objectId: number, version: number, fileName: string): void {
    if (!objectId || !version) {
      console.error('[FRONT] ❌ ObjectId or Version is undefined');
      return;
    }

    console.log(`[FRONT] ✅ Downloading document with ObjectId: ${objectId} and Version: ${version}`);

    this.mfilesService.downloadDocument(this.authToken, this.baseUrl, objectId, version).subscribe(
      (event) => {
        if (event.type === HttpEventType.Response) {
          const blob = event.body as Blob;
          const blobUrl = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName || 'document.pdf'; // Nom du fichier
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            console.log('[FRONT] ℹ️ Blob URL revoked');
          }, 1000);
        }
      },
      (error) => {
        console.error('[FRONT] ❌ Error downloading document:', error);
      }
    );
  }

  openDocumentForPreview(objectId: number, version: number): void {
    if (!objectId || !version) {
      console.error('[Preview] Erreur : objectId ou version manquants');
      return;
    }

    this.loading = true;
    this.loadingProgress = 0;
    this.errorMessage = '';
    this.previewUrl = null;
    this.rawBlobUrl = null;
    this.isOfficeType = false;
    this.isDocumentOpen = false;

    const headers = new HttpHeaders({
      'X-Authentication': this.authToken,
      'Base-Url': this.baseUrl
    });

    // Simulation de progression douce
    const progressInterval = setInterval(() => {
      if (this.loadingProgress < 90) {
        this.loadingProgress += 5;
      }
    }, 300); // Toutes les 300ms

    this.http.get<{ pdfUrl: string, originalUrl: string }>(
      `http://localhost:5113/api/mfiles/convert/${objectId}/${version}`,
      { headers }
    ).subscribe(
      (res) => {
        clearInterval(progressInterval);
        this.loadingProgress = 100;

        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.pdfUrl);
        this.rawBlobUrl = res.originalUrl;
        this.isOfficeType = true;
        this.isDocumentOpen = true;
        this.loading = false;
      },
      (error) => {
        clearInterval(progressInterval);
        this.errorMessage = error?.error?.message || 'Erreur lors de la conversion en PDF.';
        this.loading = false;
      }
    );
  }


  getDocumentMetadata(objectType: number, objectId: number): void {
    console.log('Fetching metadata for objectId:', objectId, 'and objectType:', objectType);

    this.mfilesService.getFormattedMetadata(this.authToken, this.baseUrl, objectType, objectId).subscribe(
      (metadata) => {
        console.log('Document metadata:', metadata);

        if (!this.selectedDocument) {
          this.selectedDocument = {}; // Initialisation si nécessaire
        }

        // Assurer que metadata est un tableau de paires clé-valeur
        this.selectedDocument.metadata = metadata ? Object.entries(metadata) : [];

      },
      (error) => {
        console.error('Failed to fetch document metadata:', error);
      }
    );
  }

  isInvalidValue(displayValue: string): boolean {
    if (!displayValue) return true; // Exclure les valeurs vides
    const lowerValue = displayValue.toLowerCase().trim();

    // Vérifie si c'est "yes", "no" ou un numéro illisible (ex: "123456789012345")
    if (lowerValue === "yes" || lowerValue === "no" || !isNaN(Number(lowerValue)) && lowerValue.length > 10) {
      return true;
    }

    return false; // Garde les autres valeurs
  }


  changePage(page: number): void {
    this.page = page;
    this.getDocumentsByProject();
  }
  isDocumentSelected = false; // Vous pouvez ajuster cette logique selon la manière dont vous gérez la sélection du document

  resetChatbot() {
    this.messages = [];
    this.question = '';
    this.isMinimized = false;
    this.showWelcomeMessage = true;
    this.isLoading = false;
    this.loadingTimeout = false;
    this.isChatClosed = false;
    this.isDocumentSelected = false; // Remettre à false si nécessaire

  }

  initializeFile() {
    console.log("🟡 Tentative d'initialisation du fichier...");

    console.log("selectedDocument ", this.selectedDocument);

    if (!this.selectedDocument || !(this.selectedDocument.file instanceof File)) {
      console.error('❌ Aucune instance File détectée dans selectedDocument :', this.selectedDocument);
      this.messages.push({
        sender: 'bot',
        text: "❗ Fichier invalide ou introuvable. Impossible d'initialiser le traitement.",
        feedback: null
      });
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.chatbotService.initFile(this.selectedDocument).subscribe({
      next: (res) => {
        console.log('Fichier initialisé avec succès');
        this.isLoading = false;
        this.sendQuestion();
      },
      error: (err) => {
        console.error('Erreur lors de l\'initialisation du fichier', err);
        this.isLoading = false;
      }
    });
  }

  loadingMessages: string[] = [
    "🤖 M‑Files BOT réfléchit intensément pour vous fournir la meilleure réponse possible",
    "🧠 L'IA explore vos documents à la recherche d'indices pertinents",
    "🚀 Traitement en cours… Préparez-vous à être surpris",
    "📚 Analyse des informations… Ça arrive très bientôt",
    "✨ Un moment magique est en préparation pour vous"
  ];

  currentLoadingMessage: string = '';
  parseAnswer(raw: string): { thought: string, answer: string } {
    const match = raw.match(/<pense>(.*?)<\/\s*think>\s*(.*)/s);
    return match
      ? {
        thought: match[1].trim(),
        answer: match[2].trim()
      }
      : { thought: '', answer: raw };
  }

  sendQuestion() {
    if (!this.question.trim()) return;

    const formData = new FormData();
    formData.append('question', this.question);

    const modelMap: { [key: string]: string } = {
      'deepseek-r1:1.5b': 'deepseek-r1:1.5b',
      'mistral:instruct': 'mistral:instruct',
    };
    const backendModel = modelMap[this.selectedModel || ''] || 'deepseek-r1:1.5b';
    formData.append('model_choice', backendModel);

    // 🟢 Ajouter la question de l'utilisateur dans le chat
    this.messages.push({
      sender: 'user',
      text: this.question,
      feedback: null
    });

    const index = Math.floor(Math.random() * this.loadingMessages.length);
    this.currentLoadingMessage = this.loadingMessages[index];
    this.isLoading = true;

    this.chatbotService.askQuestion(formData).subscribe({
      next: (res) => {
        const parsed = this.parseAnswerWithThoughts(res.answer);
        this.playThoughtsStepByStep(parsed.thoughtSteps, parsed.answer);
        this.analysisResult = {
          links: res.links_found,
          similarDocs: res.similar_documents
        };
      },
      error: () => {
        this.messages.push({ sender: 'bot', text: "❌ Une erreur est survenue.", feedback: null });
        this.isLoading = false;
      }
    });

    // Optionnel : vider la zone de texte après envoi
    this.question = '';
  }

  parseAnswerWithThoughts(raw: string): { thoughtSteps: string[], answer: string } {
    const match = raw.match(/<pense>(.*?)<\/\s*think>\s*(.*)/s);
    if (!match) return { thoughtSteps: [], answer: raw };

    const rawThoughts = match[1].trim().split(/\n+/).filter(line => line.trim());
    const answer = match[2].trim();
    return { thoughtSteps: rawThoughts, answer };
  }
  playThoughtsStepByStep(thoughts: string[], finalAnswer: string) {
    let index = 0;

    const showNext = () => {
      if (index < thoughts.length) {
        this.messages.push({
          sender: 'bot',
          text: `<strong>🧠 Étape ${index + 1}</strong><br>${thoughts[index]}`,
          feedback: null
        });
        index++;
        setTimeout(showNext, 1200); // délai entre chaque pensée
      } else {
        // Afficher la réponse finale après toutes les étapes
        this.messages.push({
          sender: 'bot',
          text: `<strong>✅ Réponse finale :</strong><br>${finalAnswer}`,
          feedback: null
        });
        this.isLoading = false;
      }
    };

    showNext();
  }


  minimizeChat() {
    this.isMinimized = true;
  }

  closeChat() {
    this.isChatClosed = true;
  }
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = event => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' }); // ou 'audio/wav'
      const audioFile = new File([audioBlob], 'question.webm', { type: 'audio/webm' });

      this.mfilesService.sendVoice(audioFile, this.selectedModel).subscribe({
        next: (res) => {
          this.messages.push({ sender: 'bot', text: res.answer, feedback: null });
        },
        error: (err) => {
          console.error('Erreur vocal:', err);
          this.messages.push({ sender: 'bot', text: "❌ Erreur lors de l'analyse vocale.", feedback: null });
        }
      });
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }).catch(err => {
    console.error("Micro non accessible :", err);
  });
}

stopRecording() {
  this.mediaRecorder?.stop();
  this.isRecording = false;
}



  handleFileUpload(event: any) {
    this.isDocumentSelected = true;
    this.analysisResult = null;  // <<-- AJOUT ICI

    const file = event.target.files[0];
    if (file) {
      this.selectedDocument = { name: file.name, file: file };
      console.log('Fichier sélectionné:', this.selectedDocument);

      this.messages.push({ sender: 'user', text: `📄 Fichier "${file.name}" envoyé.`, feedback: null });

      this.resetChatbot();

      this.initializeFile();

    } else {
      this.selectedDocument = null;
      this.messages.push({ sender: 'user', text: "❌ Aucun fichier valide sélectionné.", feedback: null });
    }
  }

  hideWelcomeMessage() {
    this.showWelcomeMessage = false;
  }
  onDocumentClick(doc: any) {
    console.log("Document sélectionné:", doc);

    // Ensure the document has a valid file attribute
    if (doc && doc.name && doc.file) {
      this.selectedDocument = { name: doc.name, file: doc.file };
      console.log('Selected Document:', this.selectedDocument);

      this.isOpen = true;
      this.isMinimized = false;
      this.showWelcomeMessage = true;
      this.cdRef.detectChanges();
    } else {
      this.selectedDocument = null;
      console.log('Aucun document valide sélectionné.');
    }
  }
  getMetadataValue(key: string): string {
    const entry = this.selectedDocument.metadata?.find(
      (entry: [string, string]) => entry[0] === key
    );
    return entry ? entry[1] : '---';
  }
  getFileExtension(): string {
    const fileName = this.selectedDocument?.Title || '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  toggleMetadata(event: Event): void {
    event.preventDefault();
    this.showAllMetadata = !this.showAllMetadata;
  }

  visibleMetadata(): [string, string][] {
    const metadata = this.selectedDocument?.metadata || [];
    return this.showAllMetadata ? metadata : metadata.slice(0, 13);
  }
  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'doc':
      case 'docx':
        return 'fas fa-file-word text-blue';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel text-green';
      case 'pdf':
        return 'fas fa-file-pdf text-red';
      case 'ppt':
      case 'pptx':
        return 'fas fa-file-powerpoint ';
      default:
        return 'fas fa-file text-gray';
    }
  }

  showShareDialog = false;
  publicLink = '';
  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('app-share-dialog, button');
    if (!clickedInside) {
      this.showShareDialog = false;
    }
  }
  public baseUrl: string = window.location.origin + window.location.pathname;

  copyConversationLink() {
    const baseUrl = window.location.href.split('?')[0];
    const params = new URLSearchParams();
    params.set('chat', btoa(JSON.stringify(this.messages)));  // base64
    this.publicLink = `${baseUrl}?${params.toString()}`;
    this.showShareDialog = true;
  }

  rateResponse(message: any, liked: boolean) {
    message.feedback = liked ? 'like' : 'dislike';
    console.log(`Feedback donné : ${liked ? '👍' : '👎'}`, message.text);

    // Optionnel : Envoie au backend
    // this.chatbotService.sendFeedback(message.text, liked).subscribe(...)
  }
  editMessage(message: any) {
    this.question = message.text;
    const index = this.messages.indexOf(message);
    if (index > -1) this.messages.splice(index, 1); // Supprimer pour éviter doublon
  }
  stopChat() {
    this.isLoading = false;
    this.loadingTimeout = false;
    this.messages.push({
      sender: 'bot',
      text: '⛔ Le chat a été interrompu.',
      feedback: null
    });
  }
  selectedLanguage: string = '';

}

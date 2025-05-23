import { ChangeDetectorRef, Component, HostListener, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChatbotService } from '../../services/chatbot.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MfilesService } from '../../services/mfiles.service';
import Swal from 'sweetalert2';
import { ToastComponent } from '../toast/toast.component';
import { ViewChild } from '@angular/core';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  feedback: 'like' | 'dislike' | null;
}

@Component({
  selector: 'app-chatbot',
  standalone: false,
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnChanges {
  @Input() document: any;
@ViewChild('toast') toast!: ToastComponent;

  selectedTab: Tab = { id: 'metadata', label: 'Metadata', icon: '🗂️' };
  tabs: Tab[] = [];

  messages: ChatMessage[] = [];
  isChatbotOpen = false;
  isMinimized = false;
  isChatClosed = false;
  showWelcomeMessage = true;
  chatHistoryVisible = false;
  chatHistory: any[] = [];
  isWidgetChatOpen = false;

  question = '';
  selectedDocument: any;
  isLoading = false;
  loadingTimeout = false;
  isDocumentSelected = false;

  selectedModel = 'deepseek-r1:1.5b';
  models: string[] = ['deepseek-r1:1.5b', 'mistral:instruct', 'gemma:2b'];
  modelDropdownOpen = false;

  analysisResult: {
    links: string[];
    similarDocs: { filename: string; similarity_score: number }[];
  } | null = null;

  isRecording = false;
  mediaRecorder!: MediaRecorder;
  audioChunks: Blob[] = [];

  showShareDialog = false;
  publicLink = '';
  isFullScreen = false;

  loadingMessages: string[] = [
    "🤖 M‑Files BOT réfléchit intensément pour vous fournir la meilleure réponse possible",
    "🧠 L'IA explore vos documents à la recherche d'indices pertinents",
    "🚀 Traitement en cours… Préparez-vous à être surpris",
    "📚 Analyse des informations… Ça arrive très bientôt",
    "✨ Un moment magique est en préparation pour vous"
  ];

  currentLoadingMessage = '';

  constructor(
    private sanitizer: DomSanitizer,
    private chatbotService: ChatbotService, private mfilesService: MfilesService
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['document'] && changes['document'].currentValue) {
      this.selectedDocument = this.document;
      this.isChatClosed = false; // ← Ouvre le chatbot
      this.isDocumentSelected = true;

      this.resetChatbot();       // ← Nettoie les anciens messages
      this.initializeFile();     // ← Initialise le document dès qu’il est sélectionné
    }
  }
  private initSessionId: string = '';

initializeFile() {
  console.log("🟡 Tentative d'initialisation du fichier...");
  console.log("selectedDocument ", this.selectedDocument);

  const isLocalFile = this.selectedDocument?.file instanceof File;

  if (!isLocalFile) {
    console.warn('⚠️ Aucun fichier local à envoyer :', this.selectedDocument);
    this.messages.push({
      sender: 'bot',
      text: "❗ Ce fichier provient d'un système distant (ex: M-Files) et ne peut pas être traité ici directement.",
      feedback: null
    });
    this.isLoading = false;
    return;
  }

  this.isLoading = true;
  this.chatbotService.initMFiles(this.selectedDocument).subscribe({
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


  openChatbotFromButton(): void {
    this.selectedTab = this.tabs.find(tab => tab.id === 'aiinfo')!;
    this.isChatbotOpen = true;
    this.isMinimized = false;
    this.isChatClosed = false;
    this.showWelcomeMessage = true;
  }

  toggleFullScreenChatbot() {
    this.isFullScreen = !this.isFullScreen;
  }

  onModelChange() {
    console.log('Modèle sélectionné :', this.selectedModel);
  }

  selectModel(model: string) {
    this.selectedModel = model;
    this.modelDropdownOpen = false;
  }

  getModelIcon(model: string): string {
    switch (model) {
      case 'deepseek-r1:1.5b':
        return 'https://res.cloudinary.com/ds6qxoyjg/image/upload/v1747070149/nasfgki7eparfncvlfnt.png';
      case 'mistral:instruct':
        return 'https://res.cloudinary.com/ds6qxoyjg/image/upload/v1747082616/ckw5mn7lxymsoap4s5r0.png';
      case 'gemma:2b':
        return 'https://res.cloudinary.com/ds6qxoyjg/image/upload/v1747085639/nz8srmxsjq07h9o72h6z.jpg';
      default:
        return '';
    }
  }

  sanitize(text: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }

  resetChatbot() {
    this.messages = [];
    this.question = '';
    this.isMinimized = false;
    this.showWelcomeMessage = true;
    this.isLoading = false;
    this.loadingTimeout = false;
    this.isChatClosed = false;
  }
showToast(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') {
  this.toast.title = title;
  this.toast.message = message;
  this.toast.type = type;
  this.toast.show();
}

sendQuestion() {
  if (this.isLoading) return;

  if (!this.selectedDocument || (!this.selectedDocument.file && !this.selectedDocument.ObjVer)) {
    this.showToast('Document manquant', 'Veuillez sélectionner ou uploader un document.', 'warning');
    return;
  }

  if (!this.question || !this.question.trim()) {
    this.showToast('Question vide', 'Veuillez poser une question.', 'info');
    return;
  }

  const currentSession = this.initSessionId;

  // Ajoute la question dans la conversation avant d’envoyer
  this.messages.push({ sender: 'user', text: this.question, feedback: null });

  const formData = new FormData();
  formData.append('question', this.question);
  formData.append('model_choice', this.selectedModel);

  console.log("📤 Envoi de la question :", this.question);
  console.log("🧠 Modèle choisi :", this.selectedModel);

  this.question = ''; // reset input
  this.isLoading = true;
  const index = Math.floor(Math.random() * this.loadingMessages.length);
  this.currentLoadingMessage = this.loadingMessages[index];

  this.chatbotService.askQuestion(formData).subscribe({
    next: (res) => {
      if (currentSession !== this.initSessionId) return;
      console.log("✅ Réponse reçue :", res);

      const parsed = this.parseAnswerWithThoughts(res.answer);
      this.playThoughtsStepByStep(parsed.thoughtSteps, parsed.answer);

      this.analysisResult = {
        links: res.links_found || [],
        similarDocs: res.similar_documents || []
      };
    },
    error: (err) => {
      if (currentSession !== this.initSessionId) return;
      console.error('❌ Erreur backend :', err);

      this.messages.push({
        sender: 'bot',
        text: '❌ Une erreur est survenue. Veuillez réessayer plus tard.',
        feedback: null
      });

      this.isLoading = false;
      this.showToast('Erreur serveur', 'Impossible de récupérer une réponse.', 'error');
    }
  });
}


  parseAnswerWithThoughts(raw: string): { thoughtSteps: string[]; answer: string } {
    if (!raw || typeof raw !== 'string') {
      return { thoughtSteps: [], answer: '❌ Réponse invalide reçue.' };
    }

    const match = raw.match(/<pense>(.*?)<\/\s*think>\s*(.*)/s);
    if (!match) return { thoughtSteps: [], answer: raw };

    const rawThoughts = match[1].trim().split(/\n+/).filter(line => line.trim());
    return { thoughtSteps: rawThoughts, answer: match[2].trim() };
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
        setTimeout(showNext, 1200);
      } else {
        this.messages.push({ sender: 'bot', text: `<strong>✅ Réponse finale :</strong><br>${finalAnswer}`, feedback: null });
        this.isLoading = false;
      }
    };
    showNext();
  }

  toggleRecording() {
    this.isRecording ? this.stopRecording() : this.startRecording();
  }

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = event => this.audioChunks.push(event.data);

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'question.webm', { type: 'audio/webm' });

        this.mfilesService.sendVoice(audioFile, this.selectedModel).subscribe({
          next: (res) => this.messages.push({ sender: 'bot', text: res.answer, feedback: null }),
          error: (err) => this.messages.push({ sender: 'bot', text: '❌ Erreur lors de l\'analyse vocale.', feedback: null })
        });
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    }).catch(err => console.error("Micro non accessible :", err));
  }

  stopRecording() {
    this.mediaRecorder?.stop();
    this.isRecording = false;
  }

handleFileUpload(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedDocument = { name: file.name, file };
    this.isDocumentSelected = true;
    this.messages.push({ sender: 'user', text: `📄 Fichier \"${file.name}\" envoyé.`, feedback: null });
    this.resetChatbot();

    // ✅ APPEL IMMÉDIAT
    this.initializeFile();

  } else {
    this.selectedDocument = null;
    this.messages.push({ sender: 'user', text: "❌ Aucun fichier valide sélectionné.", feedback: null });
  }
}

  rateResponse(message: ChatMessage, liked: boolean) {
    message.feedback = liked ? 'like' : 'dislike';
    console.log(`Feedback donné : ${liked ? '👍' : '👎'}`, message.text);
  }

  editMessage(message: ChatMessage) {
    this.question = message.text;
    const index = this.messages.indexOf(message);
    if (index > -1) this.messages.splice(index, 1);
  }

  stopChat() {
    this.isLoading = false;
    this.loadingTimeout = false;
    this.messages.push({ sender: 'bot', text: '⛔ Le chat a été interrompu.', feedback: null });
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('app-share-dialog, button');
    if (!clickedInside) this.showShareDialog = false;
  }

  copyConversationLink() {
    const baseUrl = window.location.href.split('?')[0];
    const params = new URLSearchParams();
    params.set('chat', btoa(JSON.stringify(this.messages)));
    this.publicLink = `${baseUrl}?${params.toString()}`;
    this.showShareDialog = true;
  }

  closeChat() {
    this.isChatClosed = true;
  }

  openHistory() {
    this.chatHistoryVisible = !this.chatHistoryVisible;
    if (this.chatHistoryVisible) {
      this.chatbotService.getHistory().subscribe({
        next: (data) => this.chatHistory = data,
        error: (err) => console.error('Erreur lors du chargement de l’historique :', err)
      });
    }
  }

  hideWelcomeMessage() {
    this.showWelcomeMessage = false;
  }
}
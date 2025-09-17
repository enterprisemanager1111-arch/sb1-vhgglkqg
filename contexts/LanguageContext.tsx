import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

export const supportedLanguages: Language[] = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
];

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
  loading: boolean;
}

const LANGUAGE_STORAGE_KEY = '@famora_selected_language';

// German translations as default
const translations = {
  de: {
    // Onboarding
    'onboarding.welcome.title': 'Willkommen bei Famora',
    'onboarding.welcome.subtitle': 'Ihr digitaler Familienorganisator',
    'onboarding.welcome.description': 'Termine, Aufgaben und Erinnerungen – alles an einem Ort für die ganze Familie.',
    'onboarding.welcome.getStarted': 'Jetzt starten',
    'onboarding.personal.title': 'Erzählen Sie uns von sich',
    'onboarding.personal.subtitle': 'Diese Informationen helfen uns, Famora perfekt für Sie anzupassen',
    'onboarding.language.title': 'Sprache auswählen',
    'onboarding.language.subtitle': 'Wählen Sie Ihre bevorzugte Sprache für die App',
    'onboarding.auth.title.signup': 'Account erstellen',
    'onboarding.auth.title.login': 'Willkommen zurück!',
    'onboarding.family.title': 'Familie einrichten',
    
    // Navigation
    'nav.home': 'Home',
    'nav.family': 'Familie',
    'nav.flames': 'Flames',
    'nav.profile': 'Profil',
    
    // Common
    'common.continue': 'Weiter',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.skip': 'Überspringen',
    'common.back': 'Zurück',
    'common.loading': 'Wird geladen...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    
    // Settings
    'settings.language.title': 'Sprache',
    'settings.language.changed': 'Sprache wurde auf',
    'settings.language.restart': 'Starten Sie die App neu, um die Änderungen zu sehen.',
    'settings.language.error': 'Sprache konnte nicht geändert werden.',
    
    // Dashboard
    'dashboard.welcome': 'Willkommen zurück in deiner Familie',
    'dashboard.family.manage': 'Familie verwalten',
    'dashboard.quickAccess': 'Schnellzugriff',
    'dashboard.nextSteps': 'Nächste Schritte',
    'dashboard.showAll': 'Alle anzeigen',
    'dashboard.todayOverview': 'Heute im Überblick',
    'dashboard.progress': 'Fortschritt',
    'dashboard.completedToday': 'Erledigt heute',
    'dashboard.thisWeek': 'Diese Woche',
    'dashboard.nextAppointment': 'Nächster Termin:',
    'dashboard.noUpcoming': 'Keine anstehenden Termine',
    'dashboard.allTasksDone': 'Alle Aufgaben erledigt!',
    'dashboard.greatJob': 'Großartig! Erstellen Sie neue Aufgaben oder entspannen Sie sich.',
    'dashboard.loading': 'Dashboard wird geladen...',
    'dashboard.shopping': 'Einkaufsliste',
    'dashboard.calendar': 'Kalender',
    'dashboard.tasks': 'Aufgaben',
    'dashboard.flames': 'Flames',
    'dashboard.items': 'Artikel',
    'dashboard.appointments': 'Termine',
    'dashboard.open': 'offen',
    'dashboard.allDone': 'Alle erledigt',
    'dashboard.points': 'Punkte',
    
    // Flames Screen
    'flames.title': 'Flames & Punkte',
    'flames.subtitle': 'Familie-Punkte gesammelt',
    'flames.loading': 'Flames werden geladen...',
    'flames.error.title': 'Fehler beim Laden',
    'flames.error.retry': 'Erneut versuchen',
    'flames.period.week': 'Woche',
    'flames.period.month': 'Monat',
    'flames.period.all': 'Gesamt',
    'flames.family.level': 'Familie Level',
    'flames.family.points': 'Familie-Punkte',
    'flames.family.progress': 'Familien-Fortschritt',
    'flames.family.progress.points': 'Punkte bis Level',
    'flames.family.maxLevel': 'Maximales Level erreicht! 👑',
    'flames.family.nextLevel': 'Nächstes Level:',
    'flames.leaderboard.title': 'Leaderboard',
    'flames.leaderboard.thisWeek': 'Diese Woche',
    'flames.leaderboard.thisMonth': 'Dieser Monat',
    'flames.leaderboard.total': 'Gesamt',
    'flames.leaderboard.you': '(Du)',
    'flames.leaderboard.achievements': 'Erfolge',
    'flames.leaderboard.activities': 'Aktivitäten',
    'flames.leaderboard.pointsToFirst': 'zum 1. Platz',
    'flames.leaderboard.points': 'Punkte',
    'flames.activities.title': 'Letzte Aktivitäten',
    'flames.activities.empty': 'Noch keine Aktivitäten',
    'flames.activities.empty.subtitle': 'Erledigen Sie Aufgaben und sammeln Sie Punkte!',
    'flames.activities.unknown': 'Unbekannt',
    'flames.achievements.title': 'Familien-Erfolge',
    'flames.achievements.unlocked': 'Freigeschaltet',
    'flames.goal.title': 'Neues Familienziel',
    'flames.goal.name': 'Zielname',
    'flames.goal.name.placeholder': 'z.B. 50 Aufgaben in der Woche',
    'flames.goal.points': 'Zielpunkte',
    'flames.goal.points.placeholder': '100',
    'flames.goal.cancel': 'Abbrechen',
    'flames.goal.create': 'Erstellen',
    'flames.goal.error.name': 'Bitte geben Sie einen Zielnamen ein',
    'flames.goal.error.points': 'Bitte geben Sie eine gültige Punktzahl ein',
    'flames.goal.error.create': 'Ziel konnte nicht erstellt werden:',
    'flames.goal.description': 'Erreiche Punkte als Familie',
    'flames.goal.created': 'hat ein neues Ziel erstellt:',
  },
  en: {
    // Onboarding
    'onboarding.welcome.title': 'Welcome to Famora',
    'onboarding.welcome.subtitle': 'Your digital family organizer',
    'onboarding.welcome.description': 'Appointments, tasks and reminders – all in one place for the whole family.',
    'onboarding.welcome.getStarted': 'Get started',
    'onboarding.personal.title': 'Tell us about yourself',
    'onboarding.personal.subtitle': 'This information helps us tailor Famora perfectly for you',
    'onboarding.language.title': 'Select language',
    'onboarding.language.subtitle': 'Choose your preferred language for the app',
    'onboarding.auth.title.signup': 'Create account',
    'onboarding.auth.title.login': 'Welcome back!',
    'onboarding.family.title': 'Set up family',
    
    // Navigation
    'nav.home': 'Home',
    'nav.family': 'Family',
    'nav.flames': 'Flames',
    'nav.profile': 'Profile',
    
    // Common
    'common.continue': 'Continue',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.skip': 'Skip',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Settings
    'settings.language.title': 'Language',
    'settings.language.changed': 'Language changed to',
    'settings.language.restart': 'Please restart the app to see the changes.',
    'settings.language.error': 'Language could not be changed.',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back to your family',
    'dashboard.family.manage': 'Manage family',
    'dashboard.quickAccess': 'Quick access',
    'dashboard.nextSteps': 'Next steps',
    'dashboard.showAll': 'Show all',
    'dashboard.todayOverview': 'Today overview',
    'dashboard.progress': 'Progress',
    'dashboard.completedToday': 'Completed today',
    'dashboard.thisWeek': 'This week',
    'dashboard.nextAppointment': 'Next appointment:',
    'dashboard.noUpcoming': 'No upcoming appointments',
    'dashboard.allTasksDone': 'All tasks done!',
    'dashboard.greatJob': 'Great! Create new tasks or relax.',
    'dashboard.loading': 'Loading dashboard...',
    'dashboard.shopping': 'Shopping list',
    'dashboard.calendar': 'Calendar',
    'dashboard.tasks': 'Tasks',
    'dashboard.flames': 'Flames',
    'dashboard.items': 'items',
    'dashboard.appointments': 'appointments',
    'dashboard.open': 'open',
    'dashboard.allDone': 'All done',
    'dashboard.points': 'points',
    
    // Flames Screen
    'flames.title': 'Flames & Points',
    'flames.subtitle': 'family points collected',
    'flames.loading': 'Loading flames...',
    'flames.error.title': 'Error loading',
    'flames.error.retry': 'Try again',
    'flames.period.week': 'Week',
    'flames.period.month': 'Month',
    'flames.period.all': 'Total',
    'flames.family.level': 'Family Level',
    'flames.family.points': 'Family Points',
    'flames.family.progress': 'Family Progress',
    'flames.family.progress.points': 'points to Level',
    'flames.family.maxLevel': 'Maximum level reached! 👑',
    'flames.family.nextLevel': 'Next Level:',
    'flames.leaderboard.title': 'Leaderboard',
    'flames.leaderboard.thisWeek': 'This Week',
    'flames.leaderboard.thisMonth': 'This Month',
    'flames.leaderboard.total': 'Total',
    'flames.leaderboard.you': '(You)',
    'flames.leaderboard.achievements': 'Achievements',
    'flames.leaderboard.activities': 'Activities',
    'flames.leaderboard.pointsToFirst': 'to 1st place',
    'flames.leaderboard.points': 'Points',
    'flames.activities.title': 'Recent Activities',
    'flames.activities.empty': 'No activities yet',
    'flames.activities.empty.subtitle': 'Complete tasks and earn points!',
    'flames.activities.unknown': 'Unknown',
    'flames.achievements.title': 'Family Achievements',
    'flames.achievements.unlocked': 'Unlocked',
    'flames.goal.title': 'New Family Goal',
    'flames.goal.name': 'Goal Name',
    'flames.goal.name.placeholder': 'e.g. 50 tasks this week',
    'flames.goal.points': 'Goal Points',
    'flames.goal.points.placeholder': '100',
    'flames.goal.cancel': 'Cancel',
    'flames.goal.create': 'Create',
    'flames.goal.error.name': 'Please enter a goal name',
    'flames.goal.error.points': 'Please enter a valid point value',
    'flames.goal.error.create': 'Goal could not be created:',
    'flames.goal.description': 'Achieve points as a family',
    'flames.goal.created': 'created a new goal:',
  },
  fr: {
    // Onboarding
    'onboarding.welcome.title': 'Bienvenue sur Famora',
    'onboarding.welcome.subtitle': 'Votre organisateur familial numérique',
    'onboarding.welcome.description': 'Rendez-vous, tâches et rappels – tout en un seul endroit pour toute la famille.',
    'onboarding.welcome.getStarted': 'Commencer',
    'onboarding.personal.title': 'Parlez-nous de vous',
    'onboarding.personal.subtitle': 'Ces informations nous aident à adapter Famora parfaitement pour vous',
    'onboarding.language.title': 'Sélectionner la langue',
    'onboarding.language.subtitle': 'Choisissez votre langue préférée pour l\'application',
    'onboarding.auth.title.signup': 'Créer un compte',
    'onboarding.auth.title.login': 'Bon retour!',
    'onboarding.family.title': 'Configurer la famille',
    
    // Navigation
    'nav.home': 'Accueil',
    'nav.family': 'Famille',
    'nav.flames': 'Flames',
    'nav.profile': 'Profil',
    
    // Common
    'common.continue': 'Continuer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.skip': 'Passer',
    'common.back': 'Retour',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    
    // Settings
    'settings.language.title': 'Langue',
    'settings.language.changed': 'Langue changée en',
    'settings.language.restart': 'Veuillez redémarrer l\'application pour voir les changements.',
    'settings.language.error': 'La langue n\'a pas pu être changée.',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenue dans votre famille',
    'dashboard.family.manage': 'Gérer la famille',
    'dashboard.quickAccess': 'Accès rapide',
    'dashboard.nextSteps': 'Prochaines étapes',
    'dashboard.showAll': 'Tout afficher',
    'dashboard.todayOverview': 'Aperçu d\'aujourd\'hui',
    'dashboard.progress': 'Progrès',
    'dashboard.completedToday': 'Terminé aujourd\'hui',
    'dashboard.thisWeek': 'Cette semaine',
    'dashboard.nextAppointment': 'Prochain rendez-vous:',
    'dashboard.noUpcoming': 'Aucun rendez-vous à venir',
    'dashboard.allTasksDone': 'Toutes les tâches terminées!',
    'dashboard.greatJob': 'Excellent! Créez de nouvelles tâches ou détendez-vous.',
    'dashboard.loading': 'Chargement du tableau de bord...',
    'dashboard.shopping': 'Liste de courses',
    'dashboard.calendar': 'Calendrier',
    'dashboard.tasks': 'Tâches',
    'dashboard.flames': 'Flames',
    'dashboard.items': 'articles',
    'dashboard.appointments': 'rendez-vous',
    'dashboard.open': 'ouvert',
    'dashboard.allDone': 'Tout fait',
    'dashboard.points': 'points',
    
    // Flames Screen
    'flames.title': 'Flammes & Points',
    'flames.subtitle': 'points de famille collectés',
    'flames.loading': 'Chargement des flammes...',
    'flames.error.title': 'Erreur de chargement',
    'flames.error.retry': 'Réessayer',
    'flames.period.week': 'Semaine',
    'flames.period.month': 'Mois',
    'flames.period.all': 'Total',
    'flames.family.level': 'Niveau Famille',
    'flames.family.points': 'Points Famille',
    'flames.family.progress': 'Progrès Famille',
    'flames.family.progress.points': 'points au Niveau',
    'flames.family.maxLevel': 'Niveau maximum atteint! 👑',
    'flames.family.nextLevel': 'Niveau Suivant:',
    'flames.leaderboard.title': 'Classement',
    'flames.leaderboard.thisWeek': 'Cette Semaine',
    'flames.leaderboard.thisMonth': 'Ce Mois',
    'flames.leaderboard.total': 'Total',
    'flames.leaderboard.you': '(Vous)',
    'flames.leaderboard.achievements': 'Succès',
    'flames.leaderboard.activities': 'Activités',
    'flames.leaderboard.pointsToFirst': 'à la 1ère place',
    'flames.leaderboard.points': 'Points',
    'flames.activities.title': 'Activités Récentes',
    'flames.activities.empty': 'Aucune activité encore',
    'flames.activities.empty.subtitle': 'Terminez des tâches et gagnez des points!',
    'flames.activities.unknown': 'Inconnu',
    'flames.achievements.title': 'Succès Familiaux',
    'flames.achievements.unlocked': 'Débloqué',
    'flames.goal.title': 'Nouvel Objectif Familial',
    'flames.goal.name': 'Nom de l\'Objectif',
    'flames.goal.name.placeholder': 'ex. 50 tâches cette semaine',
    'flames.goal.points': 'Points Objectif',
    'flames.goal.points.placeholder': '100',
    'flames.goal.cancel': 'Annuler',
    'flames.goal.create': 'Créer',
    'flames.goal.error.name': 'Veuillez entrer un nom d\'objectif',
    'flames.goal.error.points': 'Veuillez entrer une valeur de points valide',
    'flames.goal.error.create': 'L\'objectif n\'a pas pu être créé:',
    'flames.goal.description': 'Atteignez des points en famille',
    'flames.goal.created': 'a créé un nouvel objectif:',
  },
  es: {
    // Onboarding
    'onboarding.welcome.title': 'Bienvenido a Famora',
    'onboarding.welcome.subtitle': 'Tu organizador familiar digital',
    'onboarding.welcome.description': 'Citas, tareas y recordatorios: todo en un lugar para toda la familia.',
    'onboarding.welcome.getStarted': 'Empezar',
    'onboarding.personal.title': 'Cuéntanos sobre ti',
    'onboarding.personal.subtitle': 'Esta información nos ayuda a adaptar Famora perfectamente para ti',
    'onboarding.language.title': 'Seleccionar idioma',
    'onboarding.language.subtitle': 'Elige tu idioma preferido para la aplicación',
    'onboarding.auth.title.signup': 'Crear cuenta',
    'onboarding.auth.title.login': '¡Bienvenido de vuelta!',
    'onboarding.family.title': 'Configurar familia',
    
    // Navigation
    'nav.home': 'Inicio',
    'nav.family': 'Familia',
    'nav.flames': 'Flames',
    'nav.profile': 'Perfil',
    
    // Common
    'common.continue': 'Continuar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.skip': 'Saltar',
    'common.back': 'Atrás',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    
    // Settings
    'settings.language.title': 'Idioma',
    'settings.language.changed': 'Idioma cambiado a',
    'settings.language.restart': 'Por favor, reinicia la aplicación para ver los cambios.',
    'settings.language.error': 'No se pudo cambiar el idioma.',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenido a tu familia',
    'dashboard.family.manage': 'Gestionar familia',
    'dashboard.quickAccess': 'Acceso rápido',
    'dashboard.nextSteps': 'Próximos pasos',
    'dashboard.showAll': 'Mostrar todo',
    'dashboard.todayOverview': 'Resumen de hoy',
    'dashboard.progress': 'Progreso',
    'dashboard.completedToday': 'Completado hoy',
    'dashboard.thisWeek': 'Esta semana',
    'dashboard.nextAppointment': 'Próxima cita:',
    'dashboard.noUpcoming': 'No hay citas próximas',
    'dashboard.allTasksDone': '¡Todas las tareas completadas!',
    'dashboard.greatJob': '¡Genial! Crea nuevas tareas o relájate.',
    'dashboard.loading': 'Cargando panel...',
    'dashboard.shopping': 'Lista de compras',
    'dashboard.calendar': 'Calendario',
    'dashboard.tasks': 'Tareas',
    'dashboard.flames': 'Flames',
    'dashboard.items': 'artículos',
    'dashboard.appointments': 'citas',
    'dashboard.open': 'abierto',
    'dashboard.allDone': 'Todo hecho',
    'dashboard.points': 'puntos',
    
    // Flames Screen
    'flames.title': 'Llamas y Puntos',
    'flames.subtitle': 'puntos de familia recopilados',
    'flames.loading': 'Cargando llamas...',
    'flames.error.title': 'Error al cargar',
    'flames.error.retry': 'Intentar de nuevo',
    'flames.period.week': 'Semana',
    'flames.period.month': 'Mes',
    'flames.period.all': 'Total',
    'flames.family.level': 'Nivel Familia',
    'flames.family.points': 'Puntos Familia',
    'flames.family.progress': 'Progreso Familia',
    'flames.family.progress.points': 'puntos al Nivel',
    'flames.family.maxLevel': '¡Nivel máximo alcanzado! 👑',
    'flames.family.nextLevel': 'Siguiente Nivel:',
    'flames.leaderboard.title': 'Tabla de Posiciones',
    'flames.leaderboard.thisWeek': 'Esta Semana',
    'flames.leaderboard.thisMonth': 'Este Mes',
    'flames.leaderboard.total': 'Total',
    'flames.leaderboard.you': '(Tú)',
    'flames.leaderboard.achievements': 'Logros',
    'flames.leaderboard.activities': 'Actividades',
    'flames.leaderboard.pointsToFirst': 'al 1er lugar',
    'flames.leaderboard.points': 'Puntos',
    'flames.activities.title': 'Actividades Recientes',
    'flames.activities.empty': 'Aún no hay actividades',
    'flames.activities.empty.subtitle': '¡Completa tareas y gana puntos!',
    'flames.activities.unknown': 'Desconocido',
    'flames.achievements.title': 'Logros Familiares',
    'flames.achievements.unlocked': 'Desbloqueado',
    'flames.goal.title': 'Nueva Meta Familiar',
    'flames.goal.name': 'Nombre de la Meta',
    'flames.goal.name.placeholder': 'ej. 50 tareas esta semana',
    'flames.goal.points': 'Puntos Meta',
    'flames.goal.points.placeholder': '100',
    'flames.goal.cancel': 'Cancelar',
    'flames.goal.create': 'Crear',
    'flames.goal.error.name': 'Por favor ingresa un nombre de meta',
    'flames.goal.error.points': 'Por favor ingresa un valor de puntos válido',
    'flames.goal.error.create': 'La meta no pudo ser creada:',
    'flames.goal.description': 'Alcanza puntos como familia',
    'flames.goal.created': 'creó una nueva meta:',
  },
  it: {
    // Onboarding
    'onboarding.welcome.title': 'Benvenuto su Famora',
    'onboarding.welcome.subtitle': 'Il tuo organizzatore familiare digitale',
    'onboarding.welcome.description': 'Appuntamenti, compiti e promemoria: tutto in un posto per tutta la famiglia.',
    'onboarding.welcome.getStarted': 'Inizia',
    'onboarding.personal.title': 'Raccontaci di te',
    'onboarding.personal.subtitle': 'Queste informazioni ci aiutano ad adattare Famora perfettamente per te',
    'onboarding.language.title': 'Seleziona lingua',
    'onboarding.language.subtitle': 'Scegli la tua lingua preferita per l\'app',
    'onboarding.auth.title.signup': 'Crea account',
    'onboarding.auth.title.login': 'Bentornato!',
    'onboarding.family.title': 'Configura famiglia',
    
    // Navigation
    'nav.home': 'Home',
    'nav.family': 'Famiglia',
    'nav.flames': 'Flames',
    'nav.profile': 'Profilo',
    
    // Common
    'common.continue': 'Continua',
    'common.cancel': 'Annulla',
    'common.save': 'Salva',
    'common.skip': 'Salta',
    'common.back': 'Indietro',
    'common.loading': 'Caricamento...',
    'common.error': 'Errore',
    'common.success': 'Successo',
    
    // Settings
    'settings.language.title': 'Lingua',
    'settings.language.changed': 'Lingua cambiata in',
    'settings.language.restart': 'Si prega di riavviare l\'app per vedere le modifiche.',
    'settings.language.error': 'La lingua non è stata cambiata.',
    
    // Dashboard
    'dashboard.welcome': 'Benvenuto nella tua famiglia',
    'dashboard.family.manage': 'Gestisci famiglia',
    'dashboard.quickAccess': 'Accesso rapido',
    'dashboard.nextSteps': 'Prossimi passi',
    'dashboard.showAll': 'Mostra tutto',
    'dashboard.todayOverview': 'Panoramica di oggi',
    'dashboard.progress': 'Progresso',
    'dashboard.completedToday': 'Completato oggi',
    'dashboard.thisWeek': 'Questa settimana',
    'dashboard.nextAppointment': 'Prossimo appuntamento:',
    'dashboard.noUpcoming': 'Nessun appuntamento in arrivo',
    'dashboard.allTasksDone': 'Tutti i compiti completati!',
    'dashboard.greatJob': 'Fantastico! Crea nuovi compiti o rilassati.',
    'dashboard.loading': 'Caricamento dashboard...',
    'dashboard.shopping': 'Lista della spesa',
    'dashboard.calendar': 'Calendario',
    'dashboard.tasks': 'Compiti',
    'dashboard.flames': 'Flames',
    'dashboard.items': 'articoli',
    'dashboard.appointments': 'appuntamenti',
    'dashboard.open': 'aperto',
    'dashboard.allDone': 'Tutto fatto',
    'dashboard.points': 'punti',
    
    // Flames Screen
    'flames.title': 'Fiamme e Punti',
    'flames.subtitle': 'punti di famiglia raccolti',
    'flames.loading': 'Caricamento fiamme...',
    'flames.error.title': 'Errore nel caricamento',
    'flames.error.retry': 'Riprova',
    'flames.period.week': 'Settimana',
    'flames.period.month': 'Mese',
    'flames.period.all': 'Totale',
    'flames.family.level': 'Livello Famiglia',
    'flames.family.points': 'Punti Famiglia',
    'flames.family.progress': 'Progresso Famiglia',
    'flames.family.progress.points': 'punti al Livello',
    'flames.family.maxLevel': 'Livello massimo raggiunto! 👑',
    'flames.family.nextLevel': 'Prossimo Livello:',
    'flames.leaderboard.title': 'Classifica',
    'flames.leaderboard.thisWeek': 'Questa Settimana',
    'flames.leaderboard.thisMonth': 'Questo Mese',
    'flames.leaderboard.total': 'Totale',
    'flames.leaderboard.you': '(Tu)',
    'flames.leaderboard.achievements': 'Risultati',
    'flames.leaderboard.activities': 'Attività',
    'flames.leaderboard.pointsToFirst': 'al 1° posto',
    'flames.leaderboard.points': 'Punti',
    'flames.activities.title': 'Attività Recenti',
    'flames.activities.empty': 'Nessuna attività ancora',
    'flames.activities.empty.subtitle': 'Completa i compiti e guadagna punti!',
    'flames.activities.unknown': 'Sconosciuto',
    'flames.achievements.title': 'Risultati Familiari',
    'flames.achievements.unlocked': 'Sbloccato',
    'flames.goal.title': 'Nuovo Obiettivo Familiare',
    'flames.goal.name': 'Nome Obiettivo',
    'flames.goal.name.placeholder': 'es. 50 compiti questa settimana',
    'flames.goal.points': 'Punti Obiettivo',
    'flames.goal.points.placeholder': '100',
    'flames.goal.cancel': 'Annulla',
    'flames.goal.create': 'Crea',
    'flames.goal.error.name': 'Inserisci un nome per l\'obiettivo',
    'flames.goal.error.points': 'Inserisci un valore di punti valido',
    'flames.goal.error.create': 'L\'obiettivo non è stato creato:',
    'flames.goal.description': 'Raggiungi punti come famiglia',
    'flames.goal.created': 'ha creato un nuovo obiettivo:',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(supportedLanguages[0]); // Default to German
  const [loading, setLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguageCode = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguageCode) {
        const language = supportedLanguages.find(lang => lang.code === savedLanguageCode);
        if (language) {
          setCurrentLanguage(language);
        }
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    const language = supportedLanguages.find(lang => lang.code === languageCode);
    if (!language) return;

    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error saving language preference:', error);
      throw error;
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    const languageTranslations = translations[currentLanguage.code as keyof typeof translations];
    let translation = languageTranslations?.[key as keyof typeof languageTranslations] || key;

    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, paramValue);
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        loading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
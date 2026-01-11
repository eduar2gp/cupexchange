importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyCuVblwRZdudPGDk1c2VPYg6zMMC3g0o3E", // Not strictly needed, but good practice
  messagingSenderId: "866576572790", // MUST MATCH your project!
  appId: "1:866576572790:web:f364313c8c1ef88911da57",
  projectId: "helloworld-a6508"
};

const firebaseApp = self.firebase.initializeApp(firebaseConfig);

// Retrieve the messaging instance
const messaging = firebaseApp.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const customData = payload.data;
  const notificationTitle = customData.customTitle;
  const notificationBody = customData.customBody;

  const notificationOptions = {
    body: notificationBody,
    icon: '/assets/icons/new-message.png',
    image: customData.image
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

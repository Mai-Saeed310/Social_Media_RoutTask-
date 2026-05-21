importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDcodux6lrpViXkMplNJ4PkpaT2eT1WuAo",
  authDomain: "social-media-app-3e9bf.firebaseapp.com",
  projectId: "social-media-app-3e9bf",
  storageBucket: "social-media-app-3e9bf.firebasestorage.app",
  messagingSenderId: "766882958399",
  appId: "1:766882958399:web:56b0379c99576811bf7c8a",
  measurementId: "G-S3VYVXG34E"
});


const messaging = firebase.messaging();

// ✅ Background Notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message:", payload);

  self.registration.showNotification(
    payload.data?.title || "New Notification",
    {
      body: payload.data?.body || "You have a message",
      // icon: "/firebase-logo.png"
    }
  );
});
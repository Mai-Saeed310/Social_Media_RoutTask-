const firebaseConfig = {
  apiKey: "AIzaSyDcodux6lrpViXkMplNJ4PkpaT2eT1WuAo",
  authDomain: "social-media-app-3e9bf.firebaseapp.com",
  projectId: "social-media-app-3e9bf",
  storageBucket: "social-media-app-3e9bf.firebasestorage.app",
  messagingSenderId: "766882958399",
  appId: "1:766882958399:web:56b0379c99576811bf7c8a",
  measurementId: "G-S3VYVXG34E"
};


firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

export { messaging };